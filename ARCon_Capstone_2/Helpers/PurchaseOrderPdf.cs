using ARCon_Capstone_2.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.IO;

public class PurchaseOrderPdf : IDocument
{
    private readonly purchase_order _po;
    private readonly byte[] _logo;


    public PurchaseOrderPdf(purchase_order po)
    {
        _po = po;
        _logo = File.ReadAllBytes("wwwroot/assets/airconi-logo.png");
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(25);
            page.PageColor(Colors.White);

            page.Content().Column(col =>
            {
                col.Spacing(12);

                BuildHeader(col);
                BuildPoAndSupplierInfo(col);
                BuildBranchInfo(col);
                BuildItemsTable(col);
                BuildNothingFollows(col);
                BuildTotals(col);
            });
        });
    }

    // ================= HEADER =================
    private void BuildHeader(ColumnDescriptor col)
    {
        col.Item().Row(row =>
        {
            // 🔹 LEFT: Logo + Title (stacked)
            row.ConstantItem(100).Column(c =>
            {
                c.Item()
                    .AlignCenter()
                        .Width(100)
                        .Height(100)
                    .Image(_logo, ImageScaling.FitArea);



                c.Item()
                    .AlignCenter()
                    .PaddingTop(2)
                    .Text("PURCHASE ORDER")
                    .FontSize(8)
                    .SemiBold()
                    .FontColor(Colors.Grey.Darken1);
            });

            // 🔹 RIGHT: PO details
            row.RelativeItem().AlignRight().Column(c =>
            {
                c.Spacing(2); // tighter vertical spacing

                c.Item()
                    .Text($"PO Number: {_po.po_number}")
                    .FontSize(8)
                    .Bold();

                c.Item()
                    .Text($"Revision: R{_po.revision}")
                    .FontSize(8);

                c.Item()
                    .Text($"Created: {_po.created_at:MMMM dd, yyyy}")
                    .FontSize(8);
            });

        });

        col.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

    }

    // ================= PO + SUPPLIER =================
    private void BuildPoAndSupplierInfo(ColumnDescriptor col)
    {
        col.Item().Table(table =>
        {
            table.ColumnsDefinition(c =>
            {
                c.ConstantColumn(140);
                c.RelativeColumn();
                c.ConstantColumn(140);
                c.RelativeColumn();
            });

            void Cell(string text, bool bold = false)
            {
                var cell = table.Cell().Border(1).Padding(4);
                if (bold)
                    cell.Text(text).Bold().FontSize(8);
                else
                    cell.Text(text).FontSize(8);
            }

            Cell("Supplier", true);
            Cell(_po.supplier?.supplier_name ?? "—");

            Cell("Expected Delivery", true);
            Cell(_po.expected_delivery?.ToString("MMMM dd, yyyy") ?? "—");

            Cell("Payment Type", true);
            Cell(_po.payment_type ?? "—");

            Cell("Last Updated", true);
            Cell(_po.updated_at?.ToString("MMMM dd, yyyy HH:mm") ?? "—");
        });
    }

    // ================= BRANCH =================
    private void BuildBranchInfo(ColumnDescriptor col)
    {
        col.Item().PaddingTop(6).Table(table =>
        {
            table.ColumnsDefinition(c =>
            {
                c.ConstantColumn(140);
                c.RelativeColumn();
                c.ConstantColumn(140);
                c.RelativeColumn();
            });

            void Cell(string text, bool bold = false)
            {
                var cell = table.Cell().Border(1).Padding(4);
                if (bold)
                    cell.Text(text).Bold().FontSize(8);
                else
                    cell.Text(text).FontSize(8);
            }

            Cell("Branch", true);
            Cell(_po.arcon_store_branch?.branch_name ?? "—");

            Cell("Email", true);
            Cell(_po.arcon_store_branch?.email ?? "—");

            Cell("Contact Number", true);
            Cell(_po.arcon_store_branch?.contact_number ?? "—");

            Cell("Delivery Address", true);
            Cell(_po.arcon_store_branch?.address ?? "—");
        });
    }


    // ================= ITEMS =================
    private void BuildItemsTable(ColumnDescriptor col)
    {
        col.Item().PaddingTop(10)
            .AlignCenter()
            .Text("ARTICLE/S")
            .Bold()
            .FontSize(10);

        col.Item().Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.ConstantColumn(55);   // SKU
                columns.RelativeColumn();     // Manufacturer
                columns.RelativeColumn();     // Model
                columns.RelativeColumn();     // Series
                columns.RelativeColumn();     // Part No
                columns.RelativeColumn();     // Form Factor
                columns.ConstantColumn(35);   // Qty
                columns.ConstantColumn(55);   // Unit Price
                columns.ConstantColumn(65);   // Line Total
            });

            // HEADER
            table.Header(header =>
            {
                header.Cell().Border(1).Padding(4).Text("SKU").Bold().FontSize(8);
                header.Cell().Border(1).Padding(4).Text("Manufacturer").Bold().FontSize(8);
                header.Cell().Border(1).Padding(4).Text("Model").Bold().FontSize(8);
                header.Cell().Border(1).Padding(4).Text("Series").Bold().FontSize(8);
                header.Cell().Border(1).Padding(4).Text("Part No").Bold().FontSize(8);
                header.Cell().Border(1).Padding(4).Text("Form Factor").Bold().FontSize(8);
                header.Cell().Border(1).Padding(4).AlignRight().Text("Qty").Bold().FontSize(8);
                header.Cell().Border(1).Padding(4).AlignRight().Text("Unit Price").Bold().FontSize(8);
                header.Cell().Border(1).Padding(4).AlignRight().Text("Line Total").Bold().FontSize(8);
            });

            foreach (var a in _po.purchase_order_articles)
            {
                table.Cell().Border(1).Padding(4).Text(a.product.sku).FontSize(8);
                table.Cell().Border(1).Padding(4).Text(a.product.manufacturer.manufacturer_name).FontSize(8);
                table.Cell().Border(1).Padding(4).Text(a.product.product_model).FontSize(8);
                table.Cell().Border(1).Padding(4).Text(a.product.product_series ?? "—").FontSize(8);
                table.Cell().Border(1).Padding(4).Text(a.product.part_number_a ?? "—").FontSize(8);
                table.Cell().Border(1).Padding(4).Text(a.product.form_factor.form_factor1 ?? "—").FontSize(8);

                table.Cell().Border(1).Padding(4).AlignRight().Text(a.qty_ordered.ToString()).FontSize(8);
                table.Cell().Border(1).Padding(4).AlignRight().Text($"{a.unit_price:N2}").FontSize(8);
                table.Cell().Border(1).Padding(4).AlignRight().Text($"{a.total_cost:N2}").FontSize(8);
            }
        });
    }


    // ================= NOTHING FOLLOWS =================
    private void BuildNothingFollows(ColumnDescriptor col)
    {
        col.Item().PaddingTop(10)
            .AlignCenter()
            .Text("****** NOTHING FOLLOWS ******")
            .SemiBold();
    }

    // ================= TOTALS =================
    private void BuildTotals(ColumnDescriptor col)
    {
        var itemCount = _po.purchase_order_articles.Count();
        var totalQuantity = _po.purchase_order_articles.Sum(a => (int?)a.qty_ordered) ?? 0;

        col.Item().PaddingTop(8).Table(table =>
        {
            table.ColumnsDefinition(c =>
            {
                c.RelativeColumn();
                c.ConstantColumn(90);
            });

            void Row(string label, string value, bool bold = false)
            {
                var left = table.Cell().Border(1).Padding(4);
                var right = table.Cell().Border(1).Padding(4).AlignRight();

                if (bold)
                {
                    left.Text(label).Bold().FontSize(8);
                    right.Text(value).Bold().FontSize(8);
                }
                else
                {
                    left.Text(label).FontSize(8);
                    right.Text(value).FontSize(8);
                }
            }

            Row("Number of Products", itemCount.ToString());
            Row("Total Quantity", totalQuantity.ToString());
            Row("Freight Cost", $"{_po.freight_cost:N2}");
            Row("Total Amount", $"{_po.total_amount:N2}", bold: true);
        });
    }

}
