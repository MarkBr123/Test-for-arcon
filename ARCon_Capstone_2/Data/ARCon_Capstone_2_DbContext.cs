using System;
using System.Collections.Generic;
using ARCon_Capstone_2.Models;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Data;

public partial class ARCon_Capstone_2_DbContext : DbContext
{
    public ARCon_Capstone_2_DbContext()
    {
    }

    public ARCon_Capstone_2_DbContext(DbContextOptions<ARCon_Capstone_2_DbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<admin_user> admin_users { get; set; }

    public virtual DbSet<arcon_store_branch> arcon_store_branches { get; set; }

    public virtual DbSet<cart> carts { get; set; }

    public virtual DbSet<cart_item> cart_items { get; set; }

    public virtual DbSet<chat_conversation> chat_conversations { get; set; }

    public virtual DbSet<chat_conversation_read> chat_conversation_reads { get; set; }

    public virtual DbSet<chat_message> chat_messages { get; set; }


    public virtual DbSet<checkout> checkouts { get; set; }

    public virtual DbSet<checkout_item> checkout_items { get; set; }

    public virtual DbSet<customer> customers { get; set; }

    public virtual DbSet<customer_address> customer_addresses { get; set; }

    public virtual DbSet<customer_transaction> customer_transactions { get; set; }

    public virtual DbSet<form_factor> form_factors { get; set; }

    public virtual DbSet<installation_additional_service_option> installation_additional_service_options { get; set; }

    public virtual DbSet<installation_std_service_option> installation_std_service_options { get; set; }

    public virtual DbSet<inventory> inventories { get; set; }

    public virtual DbSet<manufacturer> manufacturers { get; set; }

    public virtual DbSet<media_url> media_urls { get; set; }

    public virtual DbSet<notification> notifications { get; set; }

    public virtual DbSet<order> orders { get; set; }

    public virtual DbSet<order_item> order_items { get; set; }

    public virtual DbSet<payment_transaction> payment_transactions { get; set; }

    public virtual DbSet<product> products { get; set; }

    public virtual DbSet<product_review> product_reviews { get; set; }

    public virtual DbSet<product_tag> product_tags { get; set; }

    public virtual DbSet<product_technology> product_technologies { get; set; }

    public virtual DbSet<purchase_order> purchase_orders { get; set; }

    public virtual DbSet<purchase_order_article> purchase_order_articles { get; set; }

    public virtual DbSet<purchased_order_received> purchased_order_receiveds { get; set; }

    public virtual DbSet<received_article> received_articles { get; set; }

    public virtual DbSet<role> roles { get; set; }

    public virtual DbSet<service> services { get; set; }

    public virtual DbSet<service_aircon_type> service_aircon_types { get; set; }

    

    public virtual DbSet<service_booking_item> service_booking_items { get; set; }

    public virtual DbSet<service_transaction_technician> service_transaction_technicians { get; set; }

    public virtual DbSet<service_category> service_categories { get; set; }

    public virtual DbSet<service_price_tier> service_price_tiers { get; set; }

    public virtual DbSet<service_review> service_reviews { get; set; }

    public virtual DbSet<specification_key> specification_keys { get; set; }

    public virtual DbSet<supplier> suppliers { get; set; }

    public virtual DbSet<supplier_return> supplier_returns { get; set; }

    public virtual DbSet<supplier_return_item> supplier_return_items { get; set; }

    public virtual DbSet<supplier_return_item_medium> supplier_return_item_media { get; set; }

    public virtual DbSet<tag> tags { get; set; }

    public virtual DbSet<technical_specification> technical_specifications { get; set; }

    public virtual DbSet<technology_type> technology_types { get; set; }

    public virtual DbSet<user_role> user_roles { get; set; }


    //Manually Added
    public virtual DbSet<barangay> barangay { get; set; }
    public virtual DbSet<municipality> municipality{ get; set; }

    public virtual DbSet<province> provinces { get; set; }
    public virtual DbSet<region> regions { get; set; }

    public virtual DbSet<lalamove_template> lalamove_templates{ get; set; }

    public virtual DbSet<delivery> deliveries { get; set; }
    public virtual DbSet<delivery_item> delivery_items { get; set; }

    public virtual DbSet<service_transaction> service_transactions { get; set; }
    public virtual DbSet<service_transaction_item> service_transaction_items { get; set; }

    public virtual DbSet<service_booking> service_bookings { get; set; }

    public virtual DbSet<chat_participant> chat_participants { get; set; }

    public virtual DbSet<chat_message_media> chat_message_medias { get; set; }

    public virtual DbSet<auth_otp> auth_otps { get; set; }

    public virtual DbSet<customer_rating> customer_ratings { get; set; }

    public virtual DbSet<service_rating> service_ratings { get; set; }

    public virtual DbSet<service_warranty_booking> service_warranty_bookings { get; set; }

    public virtual DbSet<service_warranty_attachment> service_warranty_attachments { get; set; }

    public virtual DbSet<outright_replacement_warranty> outright_replacement_warranties { get; set; }
    public virtual DbSet<outright_replacement_warranty_item> outright_replacement_warranty_items{ get; set; }
    public virtual DbSet<outright_replacement_warranty_attachment> outright_replacement_warranty_attachments { get; set; }

    public virtual DbSet<airconi_notification> airconi_notifications { get; set; }

    //end manually added

    public virtual DbSet<work_schedule> work_schedules { get; set; }

    public virtual DbSet<products_media> products_medias { get; set; }

    /*protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
            #warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
         => optionsBuilder.UseNpgsql(
            "Host=dpg-d7oethosfn5c739bjk10-a.singapore-postgres.render.com;Port=5432;Database=arcon_db;Username=arcon_db_user;Password=NTa14fwUh7O4wq5eKCBxJb3sSLbKQ1Vz;SSL Mode=Require;"
         );*/

    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseNpgsql("Host=dpg-d7oethosfn5c739bjk10-a.singapore-postgres.render.com;Port=5432;Database=arcon_db;Username=arcon_db_user;Password=NTa14fwUh7O4wq5eKCBxJb3sSLbKQ1Vz;SSL Mode=Require;Trust Server Certificate=true");
        }
    }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .HasPostgresEnum("discount_type", new[] { "NONE", "PERCENTAGE", "AMOUNT" })
            .HasPostgresEnum("product_status", new[] { "ACTIVE", "DISCONTINUED", "DRAFT" })
            .HasPostgresEnum("user_status", new[] { "ACTIVE", "SUSPENDED", "ARCHIVED" });

        //MANUALLY ADDED

        // barangay
        modelBuilder.Entity<barangay>(entity =>
        {
            entity.HasKey(e => e.id);

            entity.Property(e => e.barangay_name)
                  .IsRequired()
                  .HasMaxLength(100);

            entity.HasOne(e => e.municipality)
                  .WithMany(m => m.barangays)
                  .HasForeignKey(e => e.municipality_id)
                  .OnDelete(DeleteBehavior.Restrict);
        });
        //municipality
        modelBuilder.Entity<municipality>(entity =>
        {
            entity.HasKey(e => e.id);

            entity.Property(e => e.municipality_name)
                  .IsRequired()
                  .HasMaxLength(100);

            // municipality → province (many-to-one)
            entity.HasOne(e => e.province)
                  .WithMany(p => p.municipalities)
                  .HasForeignKey(e => e.province_id)
                  .OnDelete(DeleteBehavior.Restrict);

            // municipality → barangays (one-to-many)
            entity.HasMany(e => e.barangays)
                  .WithOne(b => b.municipality)
                  .HasForeignKey(b => b.municipality_id)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        //province
        modelBuilder.Entity<province>(entity =>
        {
            entity.HasKey(e => e.id);

            entity.Property(e => e.province_name)
                  .IsRequired()
                  .HasMaxLength(100);

            // province → region (many-to-one)
            entity.HasOne(e => e.region)
                  .WithMany(r => r.provinces)
                  .HasForeignKey(e => e.region_id)
                  .OnDelete(DeleteBehavior.Restrict);

            // province → municipalities (one-to-many)
            entity.HasMany(e => e.municipalities)
                  .WithOne(m => m.province)
                  .HasForeignKey(m => m.province_id)
                  .OnDelete(DeleteBehavior.Restrict);
        });
        //region
        modelBuilder.Entity<region>(entity =>
        {
            entity.HasKey(e => e.id);

            entity.Property(e => e.region_name)
                  .IsRequired()
                  .HasMaxLength(100);

            entity.Property(e => e.region_description)
                  .IsRequired();

            // region → provinces (one-to-many)
            entity.HasMany(e => e.provinces)
                  .WithOne(p => p.region)
                  .HasForeignKey(p => p.region_id)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<lalamove_template>(entity =>
        {
            entity.ToTable("lalamove_templates");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.template_name)
                  .HasColumnName("template_name");

            entity.Property(e => e.request_body)
                  .HasColumnName("request_body")
                  .HasColumnType("jsonb");
        });

        modelBuilder.Entity<delivery>(entity =>
        {
            entity.ToTable("deliveries");

            entity.HasKey(e => e.id);

            entity.Property(e => e.delivery_ref_code)
                  .IsRequired()
                  .HasMaxLength(50);

            entity.HasIndex(e => e.delivery_ref_code)
                  .IsUnique();

            entity.Property(e => e.courier)
                  .HasMaxLength(50);

            entity.Property(e => e.status)
                  .HasMaxLength(30)
                  .HasDefaultValue("PENDING");

            entity.Property(e => e.deliverytotalweight)
                  .HasColumnType("numeric(8,2)");

            entity.Property(e => e.tracking_number)
                  .HasMaxLength(100);

            entity.Property(e => e.created_at)
                  .HasDefaultValueSql("NOW()");

            entity.Property(e => e.in_transit_at);

            // Relationship: delivery → customer_transaction
            entity.HasOne(d => d.customer_transaction)
                  .WithMany(ct => ct.deliveries)
                  .HasForeignKey(d => d.customer_transaction_id)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<delivery_item>(entity =>
        {
            entity.ToTable("delivery_items");

            entity.HasKey(e => e.id);

            entity.Property(e => e.created_at)
                  .HasDefaultValueSql("NOW()");

            // Relationship: delivery_item → delivery
            entity.HasOne(di => di.delivery)
                  .WithMany(d => d.delivery_items)
                  .HasForeignKey(di => di.delivery_id)
                  .OnDelete(DeleteBehavior.Cascade);

            // Relationship: delivery_item → checkout_item
            entity.HasOne(di => di.checkout_item)
                  .WithMany(ci => ci.delivery_items)
                  .HasForeignKey(di => di.checkout_item_id)
                  .OnDelete(DeleteBehavior.Restrict);

            // Relationship: delivery_item → inventory
            entity.HasOne(di => di.inventory)
                          .WithOne(i => i.delivery_item)
                          .HasForeignKey<delivery_item>(di => di.inventory_id)
                          .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(d => d.customer_ratings)
                .WithOne(r => r.delivery_item)
                .HasForeignKey(r => r.delivery_item_id)
                .IsRequired(false) // nullable
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("customer_ratings_delivery_item_id_fkey");

            entity.HasMany(d => d.outright_replacement_warranty_items)
                .WithOne(p => p.original_delivery_item)
                .HasForeignKey(d => d.original_delivery_item_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("outright_replacement_warranty_items_original_delivery_item_id_fkey");
        });

        modelBuilder.Entity<service_transaction>(entity =>
        {
            entity.HasKey(e => e.id).HasName("service_transaction_pkey");
            entity.ToTable("service_transaction");
            entity.Property(e => e.id)
                .UseIdentityAlwaysColumn();
            entity.Property(e => e.st_ref_code)
                .IsRequired()
                .HasMaxLength(50);
            entity.Property(e => e.created_at)
                .HasDefaultValueSql("now()");
            entity.Property(e => e.difficulty_rate)
                .HasPrecision(2, 1);
            entity.Property(e => e.service_rating)
                .HasPrecision(2, 1);
            entity.Property(e => e.reservice_fee)
                .HasPrecision(12, 2);
            entity.Property(e => e.status)
                .HasMaxLength(30);

            // Relationship
            entity.HasOne(d => d.service_booking)
                .WithMany(p => p.service_transactions)
                .HasForeignKey(d => d.service_booking_id)
                .HasConstraintName("service_transaction_service_booking_id_fkey");

            // Indexes for scheduling queries
            entity.HasIndex(e => e.actual_scheduled_date)
                .HasDatabaseName("idx_service_transaction_schedule_date");

            entity.HasIndex(e => e.actual_scheduled_time)
                .HasDatabaseName("idx_service_transaction_schedule_time");

            entity.HasMany(x => x.service_warranty_bookings)    
                .WithOne(x => x.service_transaction)
                .HasForeignKey(
                 x => x.linked_service_transaction_id)
                .OnDelete(DeleteBehavior.SetNull);


        });

        modelBuilder.Entity<service_transaction_item>(entity =>
        {
            entity.HasKey(e => e.id).HasName("service_transaction_item_pkey");

            entity.ToTable("service_transaction_item");

            entity.Property(e => e.id)
                .UseIdentityAlwaysColumn();

            entity.Property(e => e.created_at)
                .HasDefaultValueSql("now()");

            entity.HasOne(d => d.service_transaction)
                .WithMany(p => p.service_transaction_items)
                .HasForeignKey(d => d.service_transaction_id)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("service_transaction_item_service_transaction_id_fkey");

            entity.HasOne(d => d.service_booking_items)
                .WithMany(p => p.service_transaction_items)
                .HasForeignKey(d => d.service_booking_items_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("service_transaction_item_service_booking_items_id_fkey");

            entity.HasIndex(e => new { e.service_transaction_id, e.service_booking_items_id })
                .IsUnique()
                .HasDatabaseName("unique_transaction_service");
        });


        modelBuilder.Entity<chat_participant>(entity =>
        {
            entity.HasKey(e => e.id);

            entity.Property(e => e.user_type)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(e => e.joined_at)
                .HasColumnType("timestamp with time zone");

            // 🔗 Relationship: chat_participant → chat_conversation
            entity.HasOne(e => e.conversation)
                .WithMany(c => c.chat_participants)
                .HasForeignKey(e => e.conversation_id)
                .OnDelete(DeleteBehavior.Cascade);

            // ⚡ Optional: prevent duplicate participants in same conversation
            entity.HasIndex(e => new { e.conversation_id, e.user_type, e.user_id })
                .IsUnique();
        });
        modelBuilder.Entity<chat_message_media>(entity =>
        {
            entity.ToTable("chat_message_media"); // 🔥 FIX

            entity.HasKey(e => e.id);

            entity.Property(e => e.file_url).IsRequired();
            entity.Property(e => e.file_name).HasMaxLength(255);
            entity.Property(e => e.file_type).HasMaxLength(50);
            entity.Property(e => e.file_size).HasColumnType("numeric(5,2)");
            entity.Property(e => e.created_at).HasDefaultValueSql("NOW()");

            entity.HasOne(e => e.chat_message)
                .WithMany(m => m.media)
                .HasForeignKey(e => e.chat_message_id)
                .OnDelete(DeleteBehavior.Cascade);
        });



        modelBuilder.Entity<auth_otp>(entity =>
        {
            entity.ToTable("auth_otp");

            entity.HasKey(e => e.id);

            entity.Property(e => e.id)
                .UseIdentityAlwaysColumn();

            entity.Property(e => e.user_id)
                .IsRequired();

            entity.Property(e => e.user_type)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.otp_code)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(e => e.expires_at)
                .IsRequired();

            entity.Property(e => e.attempt_count)
                .HasDefaultValue(0);

            entity.Property(e => e.locked_until)
                .IsRequired(false);

            entity.Property(e => e.created_at)
                .HasDefaultValueSql("NOW()");

            // 🔥 Optional but recommended index (faster lookup)
            entity.HasIndex(e => new { e.user_id, e.user_type });
        });


        modelBuilder.Entity<customer_rating>(entity =>
        {
            entity.HasKey(e => e.id).HasName("customer_ratings_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.isposted).HasDefaultValue(false);

            entity.Property(e => e.rating)
                .IsRequired();

            entity.HasOne(d => d.customer)
                .WithMany(p => p.customer_ratings)
                .HasForeignKey(d => d.customer_id)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("customer_ratings_customer_id_fkey");

            entity.HasOne(d => d.product)
                .WithMany(p => p.customer_ratings)
                .HasForeignKey(d => d.product_id)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("customer_ratings_product_id_fkey");

     
            entity.HasOne(d => d.customer_transaction)
                .WithMany(p => p.customer_ratings)
                .HasForeignKey(d => d.transaction_id)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("customer_ratings_transaction_id_fkey");

            entity.HasOne(d => d.delivery_item)
                .WithMany(p => p.customer_ratings)
                .HasForeignKey(d => d.delivery_item_id)
                .IsRequired(false) 
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("customer_ratings_delivery_item_id_fkey");

            entity.HasIndex(e => new { e.customer_id, e.transaction_id, e.product_id })
                .IsUnique()
                .HasDatabaseName("ux_customer_ratings_unique");
        });

        modelBuilder.Entity<service_rating>(entity =>
        {
            entity.ToTable("service_ratings");

            entity.HasKey(e => e.id);

            entity.Property(e => e.id)
                .HasColumnName("id");

            entity.Property(e => e.rating)
                .HasColumnName("rating")
                .IsRequired();

            entity.Property(e => e.comment)
                .HasColumnName("comment")
                .HasMaxLength(255);

            entity.Property(e => e.isposted)
                .HasColumnName("isposted")
                .HasDefaultValue(false);

            entity.Property(e => e.created_at)
                .HasColumnName("created_at")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(e => e.service_booking_id)
                .HasColumnName("service_booking_id")
                .IsRequired();

            entity.Property(e => e.customer_id)
                .HasColumnName("customer_id");

            // 🔗 FIXED RELATIONSHIPS

            entity.HasOne(e => e.service_booking)
                .WithMany(b => b.service_ratings) // ✅ linked navigation
                .HasForeignKey(e => e.service_booking_id)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.customer)
                .WithMany(c => c.service_ratings) // ✅ linked navigation
                .HasForeignKey(e => e.customer_id)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<service_warranty_booking>(entity =>
        {
            entity.HasKey(x => x.id);

            entity.Property(x => x.complaint)
                .IsRequired();

            entity.Property(x => x.status)
                .HasMaxLength(30)
                .HasDefaultValue("PENDING_REVIEW");

            entity.Property(x => x.is_repeat_issue)
                .HasDefaultValue(false);

            entity.Property(x => x.created_at)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");


            entity.HasOne(x => x.service_booking)
                .WithMany(x => x.service_warranty_bookings)
                .HasForeignKey(x => x.service_booking_id)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.customer)
                .WithMany(x => x.service_warranty_bookings)
                .HasForeignKey(x => x.customer_id)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(x => x.service_warranty_attachments)
                .WithOne(x => x.service_warranty_booking)
                .HasForeignKey(x => x.service_warranty_booking_id)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.service_transaction)

               .WithMany(p => p.service_warranty_bookings)

               .HasForeignKey(d => d.linked_service_transaction_id)

               .OnDelete(DeleteBehavior.SetNull)

               .HasConstraintName(
                   "fk_service_warranty_linked_transaction"
                 );

        });


        modelBuilder.Entity<service_warranty_attachment>(entity =>
        {
            entity.HasKey(x => x.id);

            entity.Property(x => x.file_name)
                .IsRequired();

            entity.Property(x => x.file_path)
                .IsRequired();

            entity.Property(x => x.file_type)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(x => x.created_at)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");


            /* =========================
               Relationships
            ========================= */

            entity.HasOne(x => x.service_warranty_booking)
                .WithMany(x => x.service_warranty_attachments)
                .HasForeignKey(x => x.service_warranty_booking_id)
                .OnDelete(DeleteBehavior.Cascade);
        });


        modelBuilder.Entity<outright_replacement_warranty>(entity =>
        {
            entity.ToTable("outright_replacement_warranties");

            entity.HasKey(e => e.id);

            entity.HasIndex(e => e.warranty_code)
                .IsUnique();

            entity.Property(e => e.status)
                .HasDefaultValue("FOR_VALIDATION");

            entity.Property(e => e.created_at)
                .HasDefaultValueSql("NOW()");

            // Relationship: outright_replacement_warranty → customer
            entity.HasOne(ow => ow.customer)
                .WithMany(c => c.outright_replacement_warranties)
                .HasForeignKey(ow => ow.customer_id)
                .OnDelete(DeleteBehavior.Restrict);

            // Relationship: outright_replacement_warranty → customer_transaction
            entity.HasOne(ow => ow.customer_transaction)
                .WithMany(ct => ct.outright_replacement_warranties)
                .HasForeignKey(ow => ow.customer_transaction_id)
                .OnDelete(DeleteBehavior.SetNull);

            // Relationship: outright_replacement_warranty → outright_replacement_warranty_items
            entity.HasMany(ow => ow.outright_replacement_warranty_items)
                .WithOne(owi => owi.outright_replacement_warranty)
                .HasForeignKey(owi => owi.outright_replacement_warranty_id)
                .OnDelete(DeleteBehavior.Cascade);

            // Relationship: outright_replacement_warranty → attachments
            entity.HasMany(ow => ow.outright_replacement_warranty_attachments)
                .WithOne(a => a.outright_replacement_warranty)
                .HasForeignKey(a => a.outright_replacement_warranty_id)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<outright_replacement_warranty_item>(entity =>
        {
            entity.ToTable("outright_replacement_warranty_items");

            entity.HasKey(e => e.id);

            entity.HasIndex(e => e.original_inventory_id)
                .IsUnique();

            entity.Property(e => e.item_status)
                .HasDefaultValue("PENDING");

            entity.Property(e => e.created_at)
                .HasDefaultValueSql("NOW()");

            // Relationship: outright_replacement_warranty_item → outright_replacement_warranty
            entity.HasOne(owi => owi.outright_replacement_warranty)
                .WithMany(ow => ow.outright_replacement_warranty_items)
                .HasForeignKey(owi => owi.outright_replacement_warranty_id)
                .OnDelete(DeleteBehavior.Cascade);

            // Relationship: outright_replacement_warranty_item → delivery_item
            entity.HasOne(owi => owi.original_delivery_item)
                .WithMany(di => di.outright_replacement_warranty_items)
                .HasForeignKey(owi => owi.original_delivery_item_id)
                .OnDelete(DeleteBehavior.Restrict);

            // Relationship: outright_replacement_warranty_item → product
            entity.HasOne(owi => owi.product)
                .WithMany(p => p.outright_replacement_warranty_items)
                .HasForeignKey(owi => owi.product_id)
                .OnDelete(DeleteBehavior.Restrict);

            // Relationship: outright_replacement_warranty_item → original inventory
            entity.HasOne(owi => owi.original_inventory)
                .WithMany(i => i.outright_replacement_warranty_itemoriginal_inventories)
                .HasForeignKey(owi => owi.original_inventory_id)
                .OnDelete(DeleteBehavior.Restrict);

            // Relationship: outright_replacement_warranty_item → replacement inventory
            entity.HasOne(owi => owi.replacement_inventory)
                .WithMany(i => i.outright_replacement_warranty_itemreplacement_inventories)
                .HasForeignKey(owi => owi.replacement_inventory_id)
                .OnDelete(DeleteBehavior.SetNull);
        });


        modelBuilder.Entity<outright_replacement_warranty_attachment>(entity =>
        {
            entity.ToTable("outright_replacement_warranty_attachments");

            entity.HasKey(e => e.id);

            entity.Property(e => e.created_at)
                .HasDefaultValueSql("NOW()");

            // Relationship: attachment → outright_replacement_warranty
            entity.HasOne(a => a.outright_replacement_warranty)
                .WithMany(ow => ow.outright_replacement_warranty_attachments)
                .HasForeignKey(a => a.outright_replacement_warranty_id)
                .OnDelete(DeleteBehavior.Cascade);
        });


        modelBuilder.Entity<airconi_notification>(entity =>
        {
            entity.ToTable("airconi_notifications");

            entity.HasKey(e => e.id);

            entity.Property(e => e.title)
                  .IsRequired()
                  .HasMaxLength(255);

            entity.Property(e => e.category)
                  .IsRequired()
                  .HasMaxLength(50);

            entity.Property(e => e.reference_type)
                  .HasMaxLength(50);

            entity.Property(e => e.is_read)
                  .HasDefaultValue(false);

            entity.Property(e => e.created_at)
                  .HasDefaultValueSql("NOW()");

            // SENDER CUSTOMER

            entity.HasOne(d => d.sender_customer)
                  .WithMany(p => p.sent_notifications_customer)
                  .HasForeignKey(d => d.sender_customer_id)
                  .OnDelete(DeleteBehavior.SetNull);

            // RECIPIENT CUSTOMER

            entity.HasOne(d => d.recipient_customer)
                  .WithMany(p => p.received_notifications_customer)
                  .HasForeignKey(d => d.recipient_customer_id)
                  .OnDelete(DeleteBehavior.Cascade);

            // SENDER ADMIN

            entity.HasOne(d => d.sender_admin_user)
                  .WithMany(p => p.sent_notifications_admin)
                  .HasForeignKey(d => d.sender_admin_user_id)
                  .OnDelete(DeleteBehavior.SetNull);

            // RECIPIENT ADMIN

            entity.HasOne(d => d.recipient_admin_user)
                  .WithMany(p => p.received_notifications_admin)
                  .HasForeignKey(d => d.recipient_admin_user_id)
                  .OnDelete(DeleteBehavior.Cascade);

            // CREATED BY ADMIN

            entity.HasOne(d => d.created_by_admin)
                  .WithMany(p => p.created_notifications_admin)
                  .HasForeignKey(d => d.created_by)
                  .OnDelete(DeleteBehavior.SetNull);
        });


        //End Manually Added


        modelBuilder.Entity<admin_user>(entity =>
        {
            entity.HasKey(e => e.id).HasName("admin_users_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.is_online).HasDefaultValue(false);
            entity.Property(e => e.login_attempts).HasDefaultValue(0);
            entity.Property(e => e.status).HasDefaultValueSql("'ACTIVE'::character varying");

            entity.HasOne(d => d.admin_user_avatar_media).WithMany(p => p.admin_users)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("admin_users_admin_user_avatar_media_id_fkey");

            entity.HasOne(d => d.created_byNavigation).WithMany(p => p.Inversecreated_byNavigation)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("admin_users_created_by_fkey");

            entity.HasOne(d => d.updated_byNavigation).WithMany(p => p.Inverseupdated_byNavigation)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("admin_users_updated_by_fkey");

            // NOTIFICATIONS SENT

            entity.HasMany(d => d.sent_notifications_admin)
                .WithOne(p => p.sender_admin_user)
                .HasForeignKey(p => p.sender_admin_user_id)
                .OnDelete(DeleteBehavior.SetNull);


            // NOTIFICATIONS RECEIVED

            entity.HasMany(d => d.received_notifications_admin)
                .WithOne(p => p.recipient_admin_user)
                .HasForeignKey(p => p.recipient_admin_user_id)
                .OnDelete(DeleteBehavior.Cascade);


            // NOTIFICATIONS CREATED

            entity.HasMany(d => d.created_notifications_admin)
                .WithOne(p => p.created_by_admin)
                .HasForeignKey(p => p.created_by)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<arcon_store_branch>(entity =>
        {
            entity.HasKey(e => e.id).HasName("arcon_store_branches_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.is_main_branch).HasDefaultValue(false);

            entity.HasOne(d => d.contact_adminNavigation).WithMany(p => p.arcon_store_branches)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("arcon_store_branches_contact_admin_fkey");
        });

        modelBuilder.Entity<cart>(entity =>
        {
            entity.HasKey(e => e.id).HasName("carts_pkey");

            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.customer).WithMany(p => p.carts).HasConstraintName("carts_customer_id_fkey");
        });

        modelBuilder.Entity<cart_item>(entity =>
        {
            entity.HasKey(e => e.id).HasName("cart_items_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.quantity).HasDefaultValue(1);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.additional_installation_service_option).WithMany(p => p.cart_items).HasConstraintName("cart_items_additional_installation_service_option_id_fkey");

            entity.HasOne(d => d.cart).WithMany(p => p.cart_items).HasConstraintName("cart_items_cart_id_fkey");

            entity.HasOne(d => d.product).WithMany(p => p.cart_items)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("cart_items_product_id_fkey");

            entity.HasOne(d => d.std_installation_service_option).WithMany(p => p.cart_items).HasConstraintName("cart_items_std_installation_service_option_id_fkey");
        });

        modelBuilder.Entity<chat_conversation>(entity =>
        {
            entity.HasKey(e => e.id).HasName("chat_conversations_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_archived).HasDefaultValue(false);
            entity.Property(e => e.is_deleted).HasDefaultValue(false);
            entity.Property(e => e.status).HasDefaultValueSql("'OPEN'::character varying");
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.assigned_csm).WithMany(p => p.chat_conversations)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("chat_conversations_assigned_csm_id_fkey");

            entity.HasOne(d => d.customer).WithMany(p => p.chat_conversations).HasConstraintName("chat_conversations_customer_id_fkey");
            entity.HasMany(d => d.chat_participants)
                .WithOne(p => p.conversation)
                .HasForeignKey(p => p.conversation_id)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<chat_conversation_read>(entity =>
        {
            entity.HasKey(e => e.id).HasName("chat_conversation_reads_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.last_read_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.conversation).WithMany(p => p.chat_conversation_reads).HasConstraintName("chat_conversation_reads_conversation_id_fkey");
        });

        modelBuilder.Entity<chat_message>(entity =>
        {
            entity.HasKey(e => e.id).HasName("chat_messages_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_deleted).HasDefaultValue(false);
            entity.Property(e => e.message_type).HasDefaultValueSql("'TEXT'::character varying");

            entity.HasOne(d => d.conversation)
                .WithMany(p => p.chat_messages)
                .HasConstraintName("chat_messages_conversation_id_fkey");

            // 🔥 FIXED RELATION
            entity.HasMany(e => e.media)
                .WithOne(m => m.chat_message)
                .HasForeignKey(m => m.chat_message_id)
                .OnDelete(DeleteBehavior.Cascade);
        });


        modelBuilder.Entity<checkout>(entity =>
        {
            entity.HasKey(e => e.id).HasName("checkouts_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.status).HasDefaultValueSql("'PENDING'::character varying");

            entity.HasOne(d => d.arcon_store_branches).WithMany(p => p.checkouts).HasConstraintName("checkouts_arcon_store_branches_id_fkey");

            entity.HasOne(d => d.customer).WithMany(p => p.checkouts)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("checkouts_customer_id_fkey");

            entity.HasOne(d => d.delivery_address).WithMany(p => p.checkouts).HasConstraintName("checkouts_delivery_address_id_fkey");
        });

        modelBuilder.Entity<checkout_item>(entity =>
        {
            entity.HasKey(e => e.id).HasName("checkout_items_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();

            entity.HasOne(d => d.additional_installation_option).WithMany(p => p.checkout_items).HasConstraintName("checkout_items_additional_installation_option_id_fkey");

            entity.HasOne(d => d.checkout).WithMany(p => p.checkout_items).HasConstraintName("checkout_items_checkout_id_fkey");

            entity.HasOne(d => d.product).WithMany(p => p.checkout_items)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("checkout_items_product_id_fkey");

            entity.HasOne(d => d.std_installation_option).WithMany(p => p.checkout_items).HasConstraintName("checkout_items_std_installation_option_id_fkey");
            entity.HasMany(d => d.delivery_items)
              .WithOne(p => p.checkout_item)
              .HasForeignKey(d => d.checkout_item_id)
              .OnDelete(DeleteBehavior.Restrict)
              .HasConstraintName("delivery_items_checkout_item_id_fkey");
        });

        modelBuilder.Entity<customer>(entity =>
        {
            entity.HasKey(e => e.id).HasName("customers_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.is_online).HasDefaultValue(false);

            entity.HasOne(d => d.customer_avatar_media).WithMany(p => p.customers)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("customers_customer_avatar_media_id_fkey");

            entity.HasMany(d => d.customer_ratings)
                .WithOne(r => r.customer)
                .HasForeignKey(r => r.customer_id)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("customer_ratings_customer_id_fkey");

            modelBuilder.Entity<service_warranty_booking>()
                .HasOne(x => x.customer)
                .WithMany(x => x.service_warranty_bookings)
                .HasForeignKey(x => x.customer_id)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(d => d.outright_replacement_warranties)
                .WithOne(p => p.customer)
                .HasForeignKey(d => d.customer_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("outright_replacement_warranties_customer_id_fkey");


            // NOTIFICATIONS SENT

            entity.HasMany(d => d.sent_notifications_customer)
                .WithOne(p => p.sender_customer)
                .HasForeignKey(p => p.sender_customer_id)
                .OnDelete(DeleteBehavior.SetNull);

            // NOTIFICATIONS RECEIVED

            entity.HasMany(d => d.received_notifications_customer)
                .WithOne(p => p.recipient_customer)
                .HasForeignKey(p => p.recipient_customer_id)
                .OnDelete(DeleteBehavior.Cascade);

        });

        modelBuilder.Entity<customer_address>(entity =>
        {
            entity.HasKey(e => e.id).HasName("customer_addresses_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_default).HasDefaultValue(false);

            //manually added part
            // -------------------------
            // barangay
            // -------------------------
            entity.HasOne(d => d.barangay)
                  .WithMany(p => p.customer_addresses)
                  .HasForeignKey(d => d.barangay_id)
                  .OnDelete(DeleteBehavior.Restrict);

            // -------------------------
            // municipality
            // -------------------------
            entity.HasOne(d => d.municipality)
                  .WithMany(p => p.customer_addresses)
                  .HasForeignKey(d => d.municipality_id)
                  .OnDelete(DeleteBehavior.Restrict);

            // -------------------------
            // province
            // -------------------------
            entity.HasOne(d => d.province)
                  .WithMany(p => p.customer_addresses)
                  .HasForeignKey(d => d.province_id)
                  .OnDelete(DeleteBehavior.Restrict);

            // -------------------------
            // region
            // -------------------------
            entity.HasOne(d => d.region)
                  .WithMany(p => p.customer_addresses)
                  .HasForeignKey(d => d.region_id)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.customer).WithMany(p => p.customer_addresses).HasConstraintName("customer_addresses_customer_id_fkey");
        });

        modelBuilder.Entity<customer_transaction>(entity =>
        {
            entity.HasKey(e => e.id).HasName("customer_transactions_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.status).HasDefaultValueSql("'PROCESSING'::character varying");

            entity.HasOne(d => d.checkout).WithMany(p => p.customer_transactions)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("customer_transactions_checkout_id_fkey");

            entity.HasOne(d => d.customer).WithMany(p => p.customer_transactions)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("customer_transactions_customer_id_fkey");

            entity.HasOne(d => d.payment_transaction).WithMany(p => p.customer_transactions).HasConstraintName("customer_transactions_payment_transaction_id_fkey");

            entity.Property(e => e.has_active_delivery)
                        .HasDefaultValue(false);


            entity.HasMany(d => d.deliveries)
                .WithOne(p => p.customer_transaction)
                .HasForeignKey(d => d.customer_transaction_id)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("deliveries_customer_transaction_id_fkey");

            entity.HasMany(d => d.customer_ratings)
                .WithOne(r => r.customer_transaction)
                .HasForeignKey(r => r.transaction_id)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("customer_ratings_transaction_id_fkey");

            entity.HasMany(d => d.outright_replacement_warranties)
            .WithOne(p => p.customer_transaction)
            .HasForeignKey(d => d.customer_transaction_id)
            .HasConstraintName("outright_replacement_warranties_customer_transaction_id_fkey");
        });

        modelBuilder.Entity<form_factor>(entity =>
        {
            entity.HasKey(e => e.id).HasName("form_factors_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.created_byNavigation).WithMany(p => p.form_factorcreated_byNavigations)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("form_factors_created_by_fkey");

            entity.HasOne(d => d.updated_byNavigation).WithMany(p => p.form_factorupdated_byNavigations)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("form_factors_updated_by_fkey");
        });

        modelBuilder.Entity<installation_additional_service_option>(entity =>
        {
            entity.HasKey(e => e.id).HasName("installation_additional_service_options_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_active).HasDefaultValue(true);
            entity.Property(e => e.is_default).HasDefaultValue(false);
        });

        modelBuilder.Entity<installation_std_service_option>(entity =>
        {
            entity.HasKey(e => e.id).HasName("installation_std_service_options_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_active).HasDefaultValue(true);
            entity.Property(e => e.is_default).HasDefaultValue(false);
        });

        modelBuilder.Entity<inventory>(entity =>
        {
            entity.HasKey(e => e.id).HasName("inventory_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.status).HasDefaultValueSql("'GOOD_STOCK'::character varying");

            entity.HasOne(d => d.added_byNavigation).WithMany(p => p.inventoryadded_byNavigations)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("inventory_added_by_fkey");

            entity.HasOne(d => d.product).WithMany(p => p.inventories)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("inventory_product_id_fkey");

            entity.HasOne(d => d.purchased_order_received).WithMany(p => p.inventories).HasConstraintName("inventory_purchased_order_received_id_fkey");

            entity.HasOne(d => d.supplier_return_item).WithMany(p => p.inventories)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("inventory_supplier_return_item_id_fkey");

            entity.HasOne(d => d.updated_byNavigation).WithMany(p => p.inventoryupdated_byNavigations)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("inventory_updated_by_fkey");

            entity.HasMany(d => d.outright_replacement_warranty_itemoriginal_inventories)
                .WithOne(p => p.original_inventory)
                .HasForeignKey(d => d.original_inventory_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("outright_replacement_warranty_items_original_inventory_id_fkey");
            entity.HasMany(d => d.outright_replacement_warranty_itemreplacement_inventories)
                .WithOne(p => p.replacement_inventory)
                .HasForeignKey(d => d.replacement_inventory_id)
                .HasConstraintName("outright_replacement_warranty_items_replacement_inventory_id_fkey");

        });

        modelBuilder.Entity<manufacturer>(entity =>
        {
            entity.HasKey(e => e.ID).HasName("manufacturer_pkey");

            entity.Property(e => e.ID)
                .HasColumnName("id")          // ✅ ADD THIS
                .UseIdentityAlwaysColumn();

            entity.Property(e => e.added_at)
                .HasColumnName("added_at")    // (good practice)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.added_byNavigation)
                .WithMany(p => p.manufactureradded_byNavigations)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("manufacturer_added_by_fkey");

            entity.HasOne(d => d.updated_byNavigation)
                .WithMany(p => p.manufacturerupdated_byNavigations)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("manufacturer_updated_by_fkey");
        });

        modelBuilder.Entity<media_url>(entity =>
        {
            entity.HasKey(e => e.id).HasName("media_url_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.created_byNavigation).WithMany(p => p.media_urls)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("media_url_created_by_fkey");
            entity.HasMany(d => d.product_medias)
                .WithOne(p => p.media)
                .HasForeignKey(p => p.media_id)
                .OnDelete(DeleteBehavior.Cascade);

        });

        modelBuilder.Entity<notification>(entity =>
        {
            entity.HasKey(e => e.id).HasName("notifications_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_read).HasDefaultValue(false);
        });

        modelBuilder.Entity<order>(entity =>
        {
            entity.HasKey(e => e.id).HasName("orders_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.status).HasDefaultValueSql("'TO PACK'::character varying");

            entity.HasOne(d => d.customer_transaction).WithMany(p => p.orders).HasConstraintName("orders_customer_transaction_id_fkey");
        });

        modelBuilder.Entity<order_item>(entity =>
        {
            entity.HasKey(e => e.id).HasName("order_items_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();

            entity.HasOne(d => d.order).WithMany(p => p.order_items).HasConstraintName("order_items_order_id_fkey");

            entity.HasOne(d => d.product).WithMany(p => p.order_items)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("order_items_product_id_fkey");
        });

        modelBuilder.Entity<payment_transaction>(entity =>
        {
            entity.HasKey(e => e.id).HasName("payment_transactions_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.checkout)
                 .WithMany(p => p.payment_transactions)
                 .HasForeignKey(d => d.checkout_id)
                 .IsRequired(false) // ⭐ THIS MAKES IT NULLABLE
                 .HasConstraintName("payment_transactions_checkout_id_fkey");
        });

        modelBuilder.Entity<product>(entity =>
        {
            entity.HasKey(e => e.id).HasName("products_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.discount_type).HasDefaultValueSql("'NONE'::discount_type");
            entity.Property(e => e.has_installation_service).HasDefaultValue(false);
            entity.Property(e => e.isdiscounted).HasDefaultValue(false);
            entity.Property(e => e.status).HasDefaultValueSql("'ACTIVE'::character varying");

            entity.HasOne(d => d.created_byNavigation).WithMany(p => p.productcreated_byNavigations)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("products_created_by_fkey");

            entity.HasOne(d => d.form_factor).WithMany(p => p.products).HasConstraintName("products_form_factor_id_fkey");

            entity.HasOne(d => d.manufacturer).WithMany(p => p.products)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("products_manufacturer_id_fkey");

            entity.HasOne(d => d.updated_byNavigation).WithMany(p => p.productupdated_byNavigations)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("products_updated_by_fkey");

            entity.HasMany(d => d.products_media)
                   .WithOne(p => p.product)
                   .HasForeignKey(p => p.product_id)
                   .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(d => d.customer_ratings)
                .WithOne(r => r.product)
                .HasForeignKey(r => r.product_id)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("customer_ratings_product_id_fkey");

            entity.HasMany(d => d.outright_replacement_warranty_items)
                .WithOne(p => p.product)
                .HasForeignKey(d => d.product_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("outright_replacement_warranty_items_product_id_fkey");

        });

        modelBuilder.Entity<products_media>(entity =>
        {
            entity.HasKey(e => e.id);

            entity.Property(e => e.is_primary)
                .HasDefaultValue(false);

            entity.HasOne(d => d.product)
                .WithMany(p => p.products_media)
                .HasForeignKey(d => d.product_id)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.media)
                .WithMany(p => p.product_medias)
                .HasForeignKey(d => d.media_id)
                .OnDelete(DeleteBehavior.Cascade);


            // 🔥 Prevent multiple primary images per product
            entity.HasIndex(e => e.product_id)
                .HasDatabaseName("ux_product_primary_image")
                .HasFilter("\"is_primary\" = true")
                .IsUnique();
        });

        modelBuilder.Entity<product_review>(entity =>
        {
            entity.HasKey(e => e.id).HasName("product_reviews_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_verified_purchase).HasDefaultValue(true);
            entity.Property(e => e.status).HasDefaultValueSql("'PUBLISHED'::character varying");

            entity.HasOne(d => d.customer).WithMany(p => p.product_reviews).HasConstraintName("product_reviews_customer_id_fkey");

            entity.HasOne(d => d.order).WithMany(p => p.product_reviews).HasConstraintName("product_reviews_order_id_fkey");

            entity.HasOne(d => d.product).WithMany(p => p.product_reviews).HasConstraintName("product_reviews_product_id_fkey");
        });

        modelBuilder.Entity<product_tag>(entity =>
        {
            entity.HasKey(e => e.id).HasName("product_tags_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();

            entity.HasOne(d => d.product).WithMany(p => p.product_tags).HasConstraintName("product_tags_product_id_fkey");

            entity.HasOne(d => d.tag).WithMany(p => p.product_tags).HasConstraintName("product_tags_tag_id_fkey");
        });

        modelBuilder.Entity<product_technology>(entity =>
        {
            entity.HasKey(e => e.id).HasName("product_technologies_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();

            entity.HasOne(d => d.product).WithMany(p => p.product_technologies).HasConstraintName("product_technologies_product_id_fkey");

            entity.HasOne(d => d.technology).WithMany(p => p.product_technologies).HasConstraintName("product_technologies_technology_id_fkey");
        });

        modelBuilder.Entity<purchase_order>(entity =>
        {
            entity.HasKey(e => e.id).HasName("purchase_order_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.freight_cost).HasDefaultValueSql("0");

            entity.HasOne(d => d.arcon_store_branch).WithMany(p => p.purchase_orders).HasConstraintName("purchase_order_arcon_branch_address_fkey");

            entity.HasOne(d => d.created_byNavigation).WithMany(p => p.purchase_orders)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("purchase_order_created_by_fkey");

            entity.HasOne(d => d.supplier).WithMany(p => p.purchase_orders)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("purchase_order_supplier_id_fkey");
        });

        modelBuilder.Entity<purchase_order_article>(entity =>
        {
            entity.HasKey(e => e.id).HasName("purchase_order_articles_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.product).WithMany(p => p.purchase_order_articles)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("purchase_order_articles_product_id_fkey");

            entity.HasOne(d => d.purchase_order).WithMany(p => p.purchase_order_articles).HasConstraintName("purchase_order_articles_purchase_order_id_fkey");
        });

        modelBuilder.Entity<purchased_order_received>(entity =>
        {
            entity.HasKey(e => e.id).HasName("purchased_order_received_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.received_date).HasDefaultValueSql("now()");

            entity.HasOne(d => d.purchase_order).WithMany(p => p.purchased_order_receiveds).HasConstraintName("purchased_order_received_purchase_order_id_fkey");

            entity.HasOne(d => d.received_byNavigation).WithMany(p => p.purchased_order_receiveds)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("purchased_order_received_received_by_fkey");
        });

        modelBuilder.Entity<received_article>(entity =>
        {
            entity.HasKey(e => e.id).HasName("received_articles_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.product).WithMany(p => p.received_articles)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("received_articles_product_id_fkey");

            entity.HasOne(d => d.purchased_order_received).WithMany(p => p.received_articles).HasConstraintName("received_articles_purchased_order_received_id_fkey");
        });

        modelBuilder.Entity<role>(entity =>
        {
            entity.HasKey(e => e.id).HasName("roles_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
        });

        modelBuilder.Entity<service>(entity =>
        {
            entity.HasKey(e => e.id).HasName("services_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();

            entity.HasOne(d => d.service_aircon_type).WithMany(p => p.services).HasConstraintName("services_service_aircon_type_id_fkey");

            entity.HasOne(d => d.service_categories).WithMany(p => p.services).HasConstraintName("services_service_categories_id_fkey");
        });

        modelBuilder.Entity<service_aircon_type>(entity =>
        {
            entity.HasKey(e => e.id).HasName("service_aircon_type_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
        });

        modelBuilder.Entity<service_booking>(entity =>
        {
            entity.HasKey(e => e.id).HasName("service_bookings_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.payment_method).HasDefaultValueSql("'AFTER SERVICE'::character varying");
            entity.Property(e => e.payment_status).HasDefaultValueSql("'PENDING'::character varying");
            entity.Property(e => e.status).HasDefaultValueSql("'Pending'::character varying");

            entity.HasOne(d => d.payment_transaction).WithMany(p => p.service_bookings).HasConstraintName("service_bookings_payment_transaction_id_fkey");

            entity.HasOne(d => d.customer_addresses).WithMany(p => p.service_bookings)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("service_bookings_customer_addresses_id_fkey");

            entity.HasOne(d => d.customer).WithMany(p => p.service_bookings)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("service_bookings_customer_id_fkey");

            modelBuilder.Entity<service_warranty_booking>()
                .HasOne(x => x.service_booking)
                .WithMany(x => x.service_warranty_bookings)
                .HasForeignKey(x => x.service_booking_id)
                .OnDelete(DeleteBehavior.Cascade);

        });

        modelBuilder.Entity<service_booking_item>(entity =>
        {
            entity.HasKey(e => e.id)
                  .HasName("service_booking_items_pkey");

            entity.Property(e => e.id)
                  .UseIdentityAlwaysColumn();

            entity.Property(e => e.unit_count)
                  .HasDefaultValue(1);

            entity.Property(e => e.total_amount)
                  .HasComputedColumnSql("(unit_count * price)", true);

            // Booking
            entity.HasOne(d => d.service_bookings)
                  .WithMany(p => p.service_booking_items)
                  .HasForeignKey(d => d.service_bookings_id)
                  .HasConstraintName("service_booking_items_service_bookings_id_fkey");

            // Service
            entity.HasOne(d => d.services)
                  .WithMany(p => p.service_booking_items)
                  .HasForeignKey(d => d.services_id)
                  .OnDelete(DeleteBehavior.ClientSetNull)
                  .HasConstraintName("service_booking_items_services_id_fkey");

            // Price Tier ✅
            entity.HasOne(d => d.service_price_tier)
                  .WithMany(p => p.service_booking_items)
                  .HasForeignKey(d => d.service_price_tier_id)
                  .HasConstraintName("service_booking_items_service_price_tiers_id_fkey");
        });

        modelBuilder.Entity<service_transaction_technician>(entity =>
        {
            entity.HasKey(e => e.id)
                .HasName("service_transaction_technicians_pkey"); // ✅ fix name

            entity.Property(e => e.id).UseIdentityAlwaysColumn();

            entity.Property(e => e.assigned_at)
                .HasDefaultValueSql("now()");

            // 🔹 Technician FK
            entity.HasOne(d => d.admin_user)
                .WithMany(p => p.service_transaction_technicians)
                .HasForeignKey(d => d.technician_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("service_transaction_technicians_technician_id_fkey");

            // 🔹 Transaction FK (FIXED)
            entity.HasOne(d => d.service_transaction)
                .WithMany(p => p.service_transaction_technicians)
                .HasForeignKey(d => d.service_transaction_id) // ✅ REQUIRED
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("service_transaction_technicians_transaction_id_fkey"); // ✅ fix name
        });

        modelBuilder.Entity<service_category>(entity =>
        {
            entity.HasKey(e => e.id).HasName("service_categories_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
        });

        modelBuilder.Entity<service_price_tier>(entity =>
        {
            entity.HasKey(e => e.id)
                  .HasName("service_price_tiers_pkey");

            entity.Property(e => e.id)
                  .UseIdentityAlwaysColumn();

            entity.Property(e => e.sort_order)
                  .HasDefaultValue(1);

            // Tier belongs to Service
            entity.HasOne(d => d.services)
                  .WithMany(p => p.service_price_tiers)
                  .HasForeignKey(d => d.services_id)
                  .HasConstraintName("service_price_tiers_services_id_fkey");

            // ✅ DO NOT configure booking items here
            // Relationship is configured from service_booking_item side
        });
        modelBuilder.Entity<service_review>(entity =>
        {
            entity.HasKey(e => e.id).HasName("service_reviews_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.customer).WithMany(p => p.service_reviews).HasConstraintName("service_reviews_customer_id_fkey");

            entity.HasOne(d => d.service_booking).WithMany(p => p.service_reviews).HasConstraintName("service_reviews_service_booking_id_fkey");
        });

        modelBuilder.Entity<specification_key>(entity =>
        {
            entity.HasKey(e => e.id).HasName("specification_keys_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
        });

        modelBuilder.Entity<supplier>(entity =>
        {
            entity.HasKey(e => e.id).HasName("suppliers_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.created_byNavigation).WithMany(p => p.suppliers)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("suppliers_created_by_fkey");

            entity.HasOne(d => d.supplier_logo_media).WithMany(p => p.suppliers)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("suppliers_supplier_logo_media_id_fkey");
        });

        modelBuilder.Entity<supplier_return>(entity =>
        {
            entity.HasKey(e => e.id).HasName("supplier_returns_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.return_date).HasDefaultValueSql("CURRENT_DATE");
            entity.Property(e => e.status).HasDefaultValueSql("'CREATED'::character varying");
            entity.Property(e => e.total_items).HasDefaultValue(0);

            entity.HasOne(d => d.created_byNavigation).WithMany(p => p.supplier_returns)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("supplier_returns_created_by_fkey");

            entity.HasOne(d => d.related_po).WithMany(p => p.supplier_returns).HasConstraintName("supplier_returns_related_po_id_fkey");

            entity.HasOne(d => d.supplier).WithMany(p => p.supplier_returns)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("supplier_returns_supplier_id_fkey");
        });

        modelBuilder.Entity<supplier_return_item>(entity =>
        {
            entity.HasKey(e => e.id).HasName("supplier_return_items_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();

            entity.HasOne(d => d.inventory).WithMany(p => p.supplier_return_items).HasConstraintName("supplier_return_items_inventory_id_fkey");

            entity.HasOne(d => d.product).WithMany(p => p.supplier_return_items)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("supplier_return_items_product_id_fkey");

            entity.HasOne(d => d.supplier_return).WithMany(p => p.supplier_return_items).HasConstraintName("supplier_return_items_supplier_return_id_fkey");
        });

        modelBuilder.Entity<supplier_return_item_medium>(entity =>
        {
            entity.HasKey(e => e.id).HasName("supplier_return_item_media_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();

            entity.HasOne(d => d.media).WithMany(p => p.supplier_return_item_media).HasConstraintName("supplier_return_item_media_media_id_fkey");

            entity.HasOne(d => d.supplier_return_item).WithMany(p => p.supplier_return_item_media).HasConstraintName("supplier_return_item_media_supplier_return_item_id_fkey");
        });

        modelBuilder.Entity<tag>(entity =>
        {
            entity.HasKey(e => e.id).HasName("tags_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<technical_specification>(entity =>
        {
            entity.HasKey(e => e.id).HasName("techical_specifications_pkey");

            entity.Property(e => e.id).HasDefaultValueSql("nextval('techical_specifications_id_seq'::regclass)");

            entity.HasOne(d => d.key).WithMany(p => p.technical_specifications).HasConstraintName("techical_specifications_key_id_fkey");

            entity.HasOne(d => d.product).WithMany(p => p.technical_specifications).HasConstraintName("techical_specifications_product_id_fkey");
        });

        modelBuilder.Entity<technology_type>(entity =>
        {
            entity.HasKey(e => e.id).HasName("technology_types_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.created_byNavigation).WithMany(p => p.technology_typecreated_byNavigations).HasConstraintName("technology_types_created_by_fkey");

            entity.HasOne(d => d.updated_byNavigation).WithMany(p => p.technology_typeupdated_byNavigations).HasConstraintName("technology_types_updated_by_fkey");
        });

        //manually added
        modelBuilder.Entity<user_role>(entity =>
        {
            entity.ToTable("user_roles");

            entity.HasKey(e => new { e.user_id, e.role_id });

            entity.HasOne(e => e.User)
                  .WithMany(u => u.user_roles)
                  .HasForeignKey(e => e.user_id)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Role)
                  .WithMany(r => r.user_roles)
                  .HasForeignKey(e => e.role_id)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<work_schedule>(entity =>
        {
            entity.HasKey(e => e.id).HasName("work_schedule_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.is_restday).HasDefaultValue(false);

            entity.HasOne(d => d.created_byNavigation).WithMany(p => p.work_schedulecreated_byNavigations)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("work_schedule_created_by_fkey");

            entity.HasOne(d => d.employee).WithMany(p => p.work_scheduleemployees).HasConstraintName("work_schedule_employee_id_fkey");

            entity.HasOne(d => d.updated_byNavigation).WithMany(p => p.work_scheduleupdated_byNavigations)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("work_schedule_updated_by_fkey");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
