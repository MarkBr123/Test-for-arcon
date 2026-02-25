using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ARCon_Capstone_2.Models
{
    public class lalamove_template
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("template_name")]
        public string template_name { get; set; }

        [Column("request_body", TypeName = "jsonb")]
        public string request_body { get; set; }
    }
}
