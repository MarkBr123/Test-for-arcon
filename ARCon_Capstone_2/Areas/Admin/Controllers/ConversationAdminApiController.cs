using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;
using CloudinaryDotNet;


[ApiController]
[Route("api/convo-admin")]
public class ConversationAdminApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    private readonly CloudinaryService _cloudinaryService;
    public ConversationAdminApiController(ARCon_Capstone_2_DbContext context, CloudinaryService cloudinaryService)
    {
        _context = context;
        _cloudinaryService = cloudinaryService;
    }

    // Get current user
    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        var userId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (userId == null || string.IsNullOrEmpty(userType))
            return Unauthorized();

        return Ok(new
        {
            userId = userId.Value,
            role = userType
        });
    }

    /// This will show the list of internal conversations (left sidebar of admin/conversation/index)

    [HttpGet("internal-users")]
    public async Task<IActionResult> GetInternalUsers(string? search = null)
    {
        var userId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (userId == null || userType == null)
            return Unauthorized();

        var allowedRoles = new[] { "ADMIN", "CSM", "AIRCON_TECHNICIAN", "SUPER_ADMIN" };

        if (!allowedRoles.Contains(userType))
            return Forbid();

        var query =
            from u in _context.admin_users
            join ur in _context.user_roles on u.id equals ur.user_id
            join r in _context.roles on ur.role_id equals r.id
            where u.status == "ACTIVE"
                  && allowedRoles.Contains(r.role_name.ToUpper())
                  && u.id != userId
            select new
            {
                u.id,
                u.first_name,
                u.last_name,
                role = r.role_name,
                isOnline = u.is_online
            };

        // 🔥 APPLY SEARCH (SAFE)
        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim().ToLower();

            query = query.Where(u =>
                (u.first_name.ToLower().Contains(keyword)) ||
                (u.last_name.ToLower().Contains(keyword)) ||
                (u.role.ToLower().Contains(keyword))
            );
        }

        // 🔥 FINAL SELECT (AFTER FILTER) with Unread Count
        var users = await query
          .Select(u => new
          {
              userId = u.id,
              name = u.first_name + " " + u.last_name,
              role = u.role,
              isOnline = u.isOnline,

              unreadCount = (
                    from cp in _context.chat_participants
                    where cp.user_id == userId

                    join other in _context.chat_participants
                        on cp.conversation_id equals other.conversation_id

                    where other.user_id == u.id

                    join m in _context.chat_messages
                        on cp.conversation_id equals m.conversation_id

                    //fixed left join
                    from r in _context.chat_conversation_reads
                        .Where(x => x.conversation_id == cp.conversation_id
                                 && x.user_id == userId)
                        .DefaultIfEmpty()

                    where m.sender_id == u.id &&
                          m.created_at > (r != null ? r.last_read_at : DateTime.MinValue)

                    select m.id
                ).Count()
          })
          .Distinct()
          .OrderBy(u => u.name)
          .ToListAsync();

        return Ok(users);
    }

    /// Mark as read
    [HttpPost("mark-read")]
    public async Task<IActionResult> MarkAsRead([FromBody] int conversationId)
    {
        var userId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (userId == null || userType == null) return Unauthorized();

        // ensure user is part of conversation
        var isParticipant = await _context.chat_participants.AnyAsync(p =>
            p.conversation_id == conversationId &&
            p.user_id == userId.Value &&
            p.user_type == userType
        );

        if (!isParticipant) return Forbid();

        var existing = await _context.chat_conversation_reads
            .FirstOrDefaultAsync(x =>
                x.conversation_id == conversationId &&
                x.user_id == userId.Value
            );

        if (existing == null)
        {
            _context.chat_conversation_reads.Add(new chat_conversation_read
            {
                conversation_id = conversationId,
                user_id = userId.Value,
                user_type = userType,
                last_read_at = DateTime.UtcNow
            });
        }
        else
        {
            existing.last_read_at = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok();
    }


    //Get unread count
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (userId == null || userType == null)
            return Unauthorized();

        var count = await (
            from m in _context.chat_messages

            join cp in _context.chat_participants
                on m.conversation_id equals cp.conversation_id

            where cp.user_id == userId.Value
                  && cp.user_type == userType

            // exclude own messages
            where !(m.sender_id == userId.Value && m.sender_type == userType)

            // LEFT JOIN READ TABLE
            from r in _context.chat_conversation_reads
                .Where(x => x.conversation_id == m.conversation_id
                         && x.user_id == userId.Value)
                .DefaultIfEmpty()

                //  only unread
            where m.created_at > (r != null ? r.last_read_at : DateTime.MinValue)

            select m.id
        ).CountAsync();

        return Ok(new { count });
    }


    /// Get or create conversation
    [HttpPost("get-or-create")]
    public async Task<IActionResult> GetOrCreateConversation([FromBody] ConversationRequestDto dto)
    {
        var userId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (userId == null || userType == null) return Unauthorized();

        int currentUserId = userId.Value;
        int targetUserId = dto.TargetUserId;
        bool isExternal = dto.IsExternal;

        //  block technician from customer chat
        if (isExternal && userType == "AIRCON_TECHNICIAN")
            return Forbid("Technicians cannot chat customers");

        //  block self chat (internal only)
        if (!isExternal && currentUserId == targetUserId)
            return BadRequest("Cannot chat with yourself");

        string chatType = isExternal ? "EXTERNAL" : "INTERNAL";

        //  one conversation per customer
        string pairKey = isExternal
            ? $"CUST_{targetUserId}"
            : (currentUserId < targetUserId
                ? $"{currentUserId}_{targetUserId}"
                : $"{targetUserId}_{currentUserId}");

        //  check existing
        var existingConversation = await _context.chat_conversations
            .FirstOrDefaultAsync(c =>
                c.pair_key == pairKey &&
                c.chat_type == chatType
            );

        if (existingConversation != null)
        {
            // ensure participant
            var exists = await _context.chat_participants.AnyAsync(p =>
                p.conversation_id == existingConversation.id &&
                p.user_id == currentUserId &&
                p.user_type == userType
            );

            if (!exists)
            {
                _context.chat_participants.Add(new chat_participant
                {
                    conversation_id = existingConversation.id,
                    user_id = currentUserId,
                    user_type = userType,
                    joined_at = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();
            }

            return Ok(new { conversationId = existingConversation.id });
        }

        //  create conversation
        var conversation = new chat_conversation
        {
            chat_type = chatType,
            status = "OPEN",
            pair_key = pairKey,
            created_at = DateTime.UtcNow
        };

        _context.chat_conversations.Add(conversation);
        await _context.SaveChangesAsync();

        //  participants
        var participants = new List<chat_participant>
    {
        new chat_participant
        {
            conversation_id = conversation.id,
            user_id = currentUserId,
            user_type = userType,
            joined_at = DateTime.UtcNow
        }
    };

        if (isExternal)
        {
            //  customer
            participants.Add(new chat_participant
            {
                conversation_id = conversation.id,
                user_id = targetUserId,
                user_type = "CUSTOMER",
                joined_at = DateTime.UtcNow
            });
        }
        else
        {
            //  internal user
            var targetUserRole = await (
                from ur in _context.user_roles
                join r in _context.roles on ur.role_id equals r.id
                where ur.user_id == targetUserId
                select r.role_name
            ).FirstOrDefaultAsync();

            if (targetUserRole == null)
                return BadRequest("Target user role not found");

            participants.Add(new chat_participant
            {
                conversation_id = conversation.id,
                user_id = targetUserId,
                user_type = targetUserRole,
                joined_at = DateTime.UtcNow
            });
        }

        _context.chat_participants.AddRange(participants);
        await _context.SaveChangesAsync();

        return Ok(new { conversationId = conversation.id });
    }



    [HttpGet("{conversationId}/messages")]
    public async Task<IActionResult> GetMessages(int conversationId)
    {
        var userId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (userId == null || userType == null) return Unauthorized();

        var messages = await _context.chat_messages
            .Where(m => m.conversation_id == conversationId)
            .Include(m => m.media)
            .OrderBy(m => m.created_at)
            .Select(m => new
            {
                m.id,
                m.message,
                m.sender_id,
                m.sender_type,
                m.created_at,
                m.message_type,

                // identify sender
                isMine = m.sender_id == userId.Value &&
                         m.sender_type == userType,

                media = m.media.Select(x => new
                {
                    x.file_url,
                    x.file_name,
                    x.file_type
                }).ToList()
            })
            .ToListAsync();

        return Ok(messages);
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
    {
        var userId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (userId == null || userType == null)
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest("Message cannot be empty");

        //  get conversation
        var conversation = await _context.chat_conversations
            .FirstOrDefaultAsync(c => c.id == dto.ConversationId);

        if (conversation == null)
            return BadRequest("Conversation not found");

        //  block technician from external chat
        if (conversation.chat_type == "EXTERNAL" &&
            userType == "AIRCON_TECHNICIAN")
        {
            return Forbid("Technicians cannot send messages to customers");
        }

        //  save message
        var message = new chat_message
        {
            conversation_id = dto.ConversationId,
            sender_id = userId.Value,
            sender_type = userType,
            message = dto.Message,
            created_at = DateTime.UtcNow
        };

        _context.chat_messages.Add(message);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            messageId = message.id,
            message = message.message,
            senderType = message.sender_type,
            createdAt = message.created_at
        });
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadFile([FromForm] UploadChatFileDto dto)
    {
        try
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            var userType = HttpContext.Session.GetString("UserType");

            if (userId == null || userType == null)
                return Unauthorized();

            if (dto.File == null || dto.File.Length == 0)
                return BadRequest("No file uploaded");

            if (dto.ConversationId <= 0)
                return BadRequest("Invalid conversation");

            //  Upload to Cloudinary
            var fileUrl = await _cloudinaryService.UploadFileAsync(dto.File);

            if (string.IsNullOrEmpty(fileUrl))
                throw new Exception("Cloudinary upload failed");

            // Determine message type
            var messageType = dto.File.ContentType.StartsWith("image")
                ? "IMAGE"
                : dto.File.ContentType.StartsWith("video")
                    ? "VIDEO"
                    : "FILE";

            //  Save chat message
            var message = new chat_message
            {
                conversation_id = dto.ConversationId,
                sender_id = userId.Value,
                sender_type = userType,
                message = dto.File.FileName,
                message_type = messageType,
                created_at = DateTime.UtcNow
            };

            _context.chat_messages.Add(message);
            await _context.SaveChangesAsync();

            //  Save media record
            var media = new chat_message_media
            {
                chat_message_id = message.id,
                chat_message = message,

                file_url = fileUrl,
                file_name = dto.File.FileName,
                file_type = dto.File.ContentType,
                file_size = Math.Round((decimal)dto.File.Length / (1024 * 1024), 2)
            };

            _context.chat_message_medias.Add(media);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                messageId = message.id,
                fileUrl = fileUrl,
                fileName = dto.File.FileName,
                messageType = messageType
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                error = ex.Message,
                inner = ex.InnerException?.Message,
                stack = ex.StackTrace
            });
        }
    }

    ///Download_PDF File
    ///
    [HttpGet("download")]
    public async Task<IActionResult> DownloadFile(string url, string fileName)
    {
        try
        {
            using var httpClient = new HttpClient();

            //  MAKE REQUEST LOOK LIKE A REAL BROWSER
            httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0");
            httpClient.DefaultRequestHeaders.Add("Accept", "*/*");

            var request = new HttpRequestMessage(System.Net.Http.HttpMethod.Get, url);

            var response = await httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                return BadRequest($"Failed to fetch file. Status: {response.StatusCode}");
            }

            var bytes = await response.Content.ReadAsByteArrayAsync();

            return File(bytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.ToString());
        }
    }

    ///Get External User
    [HttpGet("external-users")]
    public async Task<IActionResult> GetExternalUsers(string? search = null)
    {
        var userId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (userId == null || userType == null)
            return Unauthorized();

        var allowedRoles = new[] { "ADMIN", "CSM", "SUPER_ADMIN"};

        if (!allowedRoles.Contains(userType))
            return Forbid();

        var query =
            from c in _context.customers
            select new
            {
                c.id,
                c.first_name,
                c.last_name,
                isOnline = c.is_online
            };

        //SEARCH
        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim().ToLower();

            query = query.Where(c =>
                c.first_name.ToLower().Contains(keyword) ||
                c.last_name.ToLower().Contains(keyword)
            );
        }

        //  FINAL SELECT (match internal format)
        var users = await query
            .Select(c => new
            {
                userId = c.id,
                name = c.first_name + " " + c.last_name,
                role = "CUSTOMER", //important for frontend
                isOnline = c.isOnline,

                unreadCount = (
                    from cp in _context.chat_participants
                    where cp.user_id == userId

                    join other in _context.chat_participants
                        on cp.conversation_id equals other.conversation_id

                    where other.user_id == c.id

                    join m in _context.chat_messages
                        on cp.conversation_id equals m.conversation_id

                    from r in _context.chat_conversation_reads
                        .Where(x => x.conversation_id == cp.conversation_id
                                 && x.user_id == userId)
                        .DefaultIfEmpty()

                    where m.sender_id == c.id &&
                          m.created_at > (r != null ? r.last_read_at : DateTime.MinValue)

                    select m.id
                ).Count()
            })
            .OrderByDescending(u => u.unreadCount) //prioritize active chats
            .ThenBy(u => u.name)
            .ToListAsync();

        return Ok(users);
    }


}

