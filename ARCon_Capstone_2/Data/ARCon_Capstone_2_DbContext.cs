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

    public virtual DbSet<chat_message_medium> chat_message_media { get; set; }

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

    public virtual DbSet<service_booking> service_bookings { get; set; }

    public virtual DbSet<service_booking_item> service_booking_items { get; set; }

    public virtual DbSet<service_booking_technician> service_booking_technicians { get; set; }

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
    public virtual DbSet<barangay> barangays { get; set; }
    public virtual DbSet<municipality> municipalities{ get; set; }

    public virtual DbSet<province> provinces { get; set; }
    public virtual DbSet<region> regions { get; set; }
    //end manually added


    public virtual DbSet<work_schedule> work_schedules { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=airconi_trading_db;Username=postgres;Password=50!20/OMEGA");

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

            /*entity.HasMany(d => d.roles).WithMany(p => p.users)
                .UsingEntity<Dictionary<string, object>>(
                    "user_role",
                    r => r.HasOne<role>().WithMany()
                        .HasForeignKey("role_id")
                        .HasConstraintName("user_roles_role_id_fkey"),
                    l => l.HasOne<admin_user>().WithMany()
                        .HasForeignKey("user_id")
                        .HasConstraintName("user_roles_user_id_fkey"),
                    j =>
                    {
                        j.HasKey("user_id", "role_id").HasName("user_roles_pkey");
                        j.ToTable("user_roles");
                    });
            */
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

            entity.HasOne(d => d.conversation).WithMany(p => p.chat_messages).HasConstraintName("chat_messages_conversation_id_fkey");
        });

        modelBuilder.Entity<chat_message_medium>(entity =>
        {
            entity.HasKey(e => e.id).HasName("chat_message_media_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.chat_message).WithMany(p => p.chat_message_media).HasConstraintName("chat_message_media_chat_message_id_fkey");
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

            entity.HasOne(d => d.checkout).WithMany(p => p.payment_transactions).HasConstraintName("payment_transactions_checkout_id_fkey");
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

            entity.HasOne(d => d.customer_addresses).WithMany(p => p.service_bookings)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("service_bookings_customer_addresses_id_fkey");

            entity.HasOne(d => d.customer).WithMany(p => p.service_bookings)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("service_bookings_customer_id_fkey");
        });

        modelBuilder.Entity<service_booking_item>(entity =>
        {
            entity.HasKey(e => e.id).HasName("service_booking_items_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.quantity).HasDefaultValue(1);
            entity.Property(e => e.total_amount).HasComputedColumnSql("((quantity)::numeric * price)", true);

            entity.HasOne(d => d.service_bookings).WithMany(p => p.service_booking_items).HasConstraintName("service_booking_items_service_bookings_id_fkey");

            entity.HasOne(d => d.services).WithMany(p => p.service_booking_items)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("service_booking_items_services_id_fkey");
        });

        modelBuilder.Entity<service_booking_technician>(entity =>
        {
            entity.HasKey(e => e.id).HasName("service_booking_technicians_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.assigned_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.admin_users).WithMany(p => p.service_booking_technicians)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("service_booking_technicians_admin_users_id_fkey");

            entity.HasOne(d => d.booking).WithMany(p => p.service_booking_technicians).HasConstraintName("service_booking_technicians_booking_id_fkey");
        });

        modelBuilder.Entity<service_category>(entity =>
        {
            entity.HasKey(e => e.id).HasName("service_categories_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
        });

        modelBuilder.Entity<service_price_tier>(entity =>
        {
            entity.HasKey(e => e.id).HasName("service_price_tiers_pkey");

            entity.Property(e => e.id).UseIdentityAlwaysColumn();
            entity.Property(e => e.sort_order).HasDefaultValue(1);

            entity.HasOne(d => d.services).WithMany(p => p.service_price_tiers).HasConstraintName("service_price_tiers_services_id_fkey");
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
