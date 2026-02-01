using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Index("email_address", Name = "admin_users_email_address_key", IsUnique = true)]
[Index("user_name", Name = "admin_users_user_name_key", IsUnique = true)]
public partial class admin_user
{
    [Key]
    public int id { get; set; }

    [StringLength(25)]
    public string user_name { get; set; } = null!;

    [StringLength(50)]
    public string first_name { get; set; } = null!;

    [StringLength(50)]
    public string last_name { get; set; } = null!;

    [StringLength(20)]
    public string contact_no { get; set; } = null!;

    [StringLength(255)]
    public string email_address { get; set; } = null!;

    [StringLength(255)]
    public string home_address { get; set; } = null!;

    [StringLength(255)]
    public string password_hash { get; set; } = null!;

    public DateTime? created_at { get; set; }

    public int? created_by { get; set; }

    public DateTime? updated_at { get; set; }

    public int? updated_by { get; set; }

    [StringLength(50)]
    public string? status { get; set; }

    public bool? is_online { get; set; }

    public int? login_attempts { get; set; }

    public DateTime? last_failed_login { get; set; }

    public DateTime? last_login { get; set; }

    [StringLength(255)]
    public string? avatar_url { get; set; }

    public DateOnly? birthday { get; set; }

    public int? admin_user_avatar_media_id { get; set; }

    [InverseProperty("created_byNavigation")]
    public virtual ICollection<admin_user> Inversecreated_byNavigation { get; set; } = new List<admin_user>();

    [InverseProperty("updated_byNavigation")]
    public virtual ICollection<admin_user> Inverseupdated_byNavigation { get; set; } = new List<admin_user>();

    [ForeignKey("admin_user_avatar_media_id")]
    [InverseProperty("admin_users")]
    public virtual media_url? admin_user_avatar_media { get; set; }

    [InverseProperty("contact_adminNavigation")]
    public virtual ICollection<arcon_store_branch> arcon_store_branches { get; set; } = new List<arcon_store_branch>();

    [InverseProperty("assigned_csm")]
    public virtual ICollection<chat_conversation> chat_conversations { get; set; } = new List<chat_conversation>();

    [ForeignKey("created_by")]
    [InverseProperty("Inversecreated_byNavigation")]
    public virtual admin_user? created_byNavigation { get; set; }

    [InverseProperty("created_byNavigation")]
    public virtual ICollection<form_factor> form_factorcreated_byNavigations { get; set; } = new List<form_factor>();

    [InverseProperty("updated_byNavigation")]
    public virtual ICollection<form_factor> form_factorupdated_byNavigations { get; set; } = new List<form_factor>();

    [InverseProperty("added_byNavigation")]
    public virtual ICollection<inventory> inventoryadded_byNavigations { get; set; } = new List<inventory>();

    [InverseProperty("updated_byNavigation")]
    public virtual ICollection<inventory> inventoryupdated_byNavigations { get; set; } = new List<inventory>();

    [InverseProperty("added_byNavigation")]
    public virtual ICollection<manufacturer> manufactureradded_byNavigations { get; set; } = new List<manufacturer>();

    [InverseProperty("updated_byNavigation")]
    public virtual ICollection<manufacturer> manufacturerupdated_byNavigations { get; set; } = new List<manufacturer>();

    [InverseProperty("created_byNavigation")]
    public virtual ICollection<media_url> media_urls { get; set; } = new List<media_url>();

    [InverseProperty("created_byNavigation")]
    public virtual ICollection<product> productcreated_byNavigations { get; set; } = new List<product>();

    [InverseProperty("updated_byNavigation")]
    public virtual ICollection<product> productupdated_byNavigations { get; set; } = new List<product>();

    [InverseProperty("created_byNavigation")]
    public virtual ICollection<purchase_order> purchase_orders { get; set; } = new List<purchase_order>();

    [InverseProperty("received_byNavigation")]
    public virtual ICollection<purchased_order_received> purchased_order_receiveds { get; set; } = new List<purchased_order_received>();

    [InverseProperty("admin_users")]
    public virtual ICollection<service_booking_technician> service_booking_technicians { get; set; } = new List<service_booking_technician>();

    [InverseProperty("created_byNavigation")]
    public virtual ICollection<supplier_return> supplier_returns { get; set; } = new List<supplier_return>();

    [InverseProperty("created_byNavigation")]
    public virtual ICollection<supplier> suppliers { get; set; } = new List<supplier>();

    [InverseProperty("created_byNavigation")]
    public virtual ICollection<technology_type> technology_typecreated_byNavigations { get; set; } = new List<technology_type>();

    [InverseProperty("updated_byNavigation")]
    public virtual ICollection<technology_type> technology_typeupdated_byNavigations { get; set; } = new List<technology_type>();

    [ForeignKey("updated_by")]
    [InverseProperty("Inverseupdated_byNavigation")]
    public virtual admin_user? updated_byNavigation { get; set; }

    [InverseProperty("created_byNavigation")]
    public virtual ICollection<work_schedule> work_schedulecreated_byNavigations { get; set; } = new List<work_schedule>();

    [InverseProperty("employee")]
    public virtual ICollection<work_schedule> work_scheduleemployees { get; set; } = new List<work_schedule>();

    [InverseProperty("updated_byNavigation")]
    public virtual ICollection<work_schedule> work_scheduleupdated_byNavigations { get; set; } = new List<work_schedule>();

    /*[ForeignKey("user_id")]
    [InverseProperty("users")]*/

    public ICollection<user_role> user_roles { get; set; } = new List<user_role>();


}
