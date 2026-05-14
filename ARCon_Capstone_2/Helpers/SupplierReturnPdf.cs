using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ARCon_Capstone_2.Models;

namespace ARCon_Capstone_2.Helpers
{
    public class SupplierReturnPdf
        : IDocument
    {
        private readonly supplier_return _return;

        public SupplierReturnPdf(
            supplier_return supplierReturn)
        {
            _return = supplierReturn;
        }



        // =====================================
        // DOCUMENT
        // =====================================

        public DocumentMetadata GetMetadata()
            => DocumentMetadata.Default;



        // =====================================
        // COMPOSE
        // =====================================

        public void Compose(
            IDocumentContainer container)
        {
            container.Page(page =>
            {
                page.Margin(30);

                page.Size(PageSizes.A4);

                page.DefaultTextStyle(x =>
                    x.FontSize(9));



                // HEADER

                page.Header()
                    .Element(BuildHeader);



                // CONTENT

                page.Content()
                    .PaddingVertical(15)
                    .Column(column =>
                    {
                        column.Spacing(20);

                        column.Item()
                            .Element(
                                BuildSupplierInfo
                            );

                        column.Item()
                            .Element(
                                BuildReturnInfo
                            );

                        column.Item()
                            .Element(
                                BuildItemsTable
                            );

                        column.Item()
                            .AlignRight()
                            .Element(
                                BuildTotals
                            );

                        column.Item()
                            .PaddingTop(30)
                            .Element(
                                BuildSignature
                            );
                    });



                // FOOTER

                page.Footer()
                    .AlignCenter()
                    .Text(text =>
                    {
                        text.Span(
                            "Generated on "
                        );

                        text.Span(
                            DateTime.Now
                                .ToString(
                                    "MMMM dd, yyyy hh:mm tt"
                                )
                        )
                        .SemiBold();
                    });
            });
        }



        // =====================================
        // HEADER
        // =====================================
        private void BuildHeader(
            IContainer container)
        {
            container.Row(row =>
            {
                // =====================================
                // LOGO
                // =====================================

                row.ConstantItem(80)
                    .Height(80)
                    .Image(
                        File.ReadAllBytes(
                            "wwwroot/assets/airconi-logo.png"
                        )
                    );



                // =====================================
                // COMPANY + TITLE
                // =====================================

                row.RelativeItem()
                    .PaddingLeft(15)
                    .Column(column =>
                    {
                        column.Spacing(3);



                        // COMPANY

                        column.Item()
                            .Text(
                                "AIRCON-i Aircon and Appliance Trading"
                            )
                            .FontSize(9)
                            .Bold()
                            .FontColor(
                                Colors.Blue.Darken2
                            );



                        // DOCUMENT TITLE

                        column.Item()
                            .Text(
                                "SUPPLIER RETURN ORDER"
                            )
                            .FontSize(7)
                            .SemiBold()
                            .FontColor(
                                Colors.LightBlue.Medium
                            );



                        // DESCRIPTION

                        column.Item()
                            .Text(
                                "Reverse Logistics / Supplier Replacement Document"
                            )
                            .FontSize(8)
                            .FontColor(
                                Colors.Grey.Darken1
                            );
                    });



                // =====================================
                // RIGHT DETAILS
                // =====================================

                row.ConstantItem(190)
                    .Border(1)
                    .BorderColor(
                        Colors.Grey.Lighten2
                    )
                    .Padding(10)
                    .Column(column =>
                    {
                        column.Spacing(5);



                        // RETURN NUMBER

                        column.Item()
                            .Text(text =>
                            {
                                text.Span(
                                    "Return No: "
                                )
                                .SemiBold();

                                text.Span(
                                    _return.return_number
                                );
                            });



                        // STATUS

                        column.Item()
                            .Text(text =>
                            {
                                text.Span(
                                    "Status: "
                                )
                                .SemiBold();

                                text.Span(
                                    _return.status
                                );
                            });



                        // RETURN DATE

                        column.Item()
                            .Text(text =>
                            {
                                text.Span(
                                    "Return Date: "
                                )
                                .SemiBold();

                                text.Span(

                                    _return.return_date.HasValue

                                        ? _return.return_date
                                            .Value
                                            .ToString("MMMM dd, yyyy")

                                        : "-"
                                );
                            });
                    });
            });
        }



        // =====================================
        // SUPPLIER INFO
        // =====================================

        private void BuildSupplierInfo(
            IContainer container)
        {
            container.Border(1)
                .BorderColor(
                    Colors.Grey.Lighten2
                )
                .Padding(12)
                .Column(column =>
                {
                    column.Spacing(5);

                    column.Item()
                        .Text(
                            "SUPPLIER INFORMATION"
                        )
                        .SemiBold()
                        .FontSize(10);

                    column.Item()
                        .Text(
                            _return.supplier
                                ?.supplier_name
                            ?? "-"
                        );

                    column.Item()
                        .Text(
                            _return.supplier
                                ?.rep_email
                            ?? "-"
                        );

                    column.Item()
                        .Text(
                            _return.supplier
                                ?.proprieto_contact_no
                            ?? "-"
                        );
                });
        }



        // =====================================
        // RETURN INFO
        // =====================================

        private void BuildReturnInfo(
    IContainer container)
        {
            container.Border(1)
                .BorderColor(
                    Colors.Grey.Lighten2
                )
                .Padding(12)
                .Column(column =>
                {
                    column.Spacing(8);



                    // TITLE

                    column.Item()
                        .Text(
                            "RETURN DETAILS"
                        )
                        .SemiBold()
                        .FontSize(10);



                    // RETURN METHOD

                    column.Item()
                        .PaddingLeft(10)
                        .Row(row =>
                        {
                            row.ConstantItem(130)
                                .Text(
                                    "Return Method:"
                                )
                                .SemiBold();

                            row.RelativeItem()
                                .Text(
                                    _return.return_method
                                    ?? "-"
                                );
                        });



                    // COURIER

                    column.Item()
                        .PaddingLeft(10)
                        .Row(row =>
                        {
                            row.ConstantItem(130)
                                .Text(
                                    "Courier:"
                                )
                                .SemiBold();

                            row.RelativeItem()
                                .Text(
                                    _return.courier_name
                                    ?? "-"
                                );
                        });



                    // TRACKING

                    column.Item()
                        .PaddingLeft(10)
                        .Row(row =>
                        {
                            row.ConstantItem(130)
                                .Text(
                                    "Tracking Number:"
                                )
                                .SemiBold();

                            row.RelativeItem()
                                .Text(
                                    _return.tracking_number
                                    ?? "-"
                                );
                        });



                    // REMARKS

                    column.Item()
                        .PaddingLeft(10)
                        .Row(row =>
                        {
                            row.ConstantItem(130)
                                .Text(
                                    "Remarks:"
                                )
                                .SemiBold();

                            row.RelativeItem()
                                .Text(
                                    _return.remarks
                                    ?? "-"
                                );
                        });
                });
        }



        // =====================================
        // ITEMS TABLE
        // =====================================

        private void BuildItemsTable(
            IContainer container)
        {
            container.Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(120);

                    columns.RelativeColumn();

                    columns.RelativeColumn();

                    columns.ConstantColumn(90);
                });



                // HEADER

                table.Header(header =>
                {
                    header.Cell()
                        .Element(CellStyle)
                        .Text("Serial No")
                        .SemiBold();

                    header.Cell()
                        .Element(CellStyle)
                        .Text("Product")
                        .SemiBold();

                    header.Cell()
                        .Element(CellStyle)
                        .Text("Reason")
                        .SemiBold();

                    header.Cell()
                        .Element(CellStyle)
                        .AlignRight()
                        .Text("Unit Cost")
                        .SemiBold();
                });



                // ROWS

                foreach (
                    var item
                    in _return
                        .supplier_return_items
                )
                {
                    table.Cell()
                        .Element(CellStyle)
                        .Text(
                            item.serial_number
                            ?? "-"
                        );

                    table.Cell()
                        .Element(CellStyle)
                        .Text(

                            $"{item.product?.manufacturer?.brand_name} " +

                            $"{item.product?.product_series} " +

                            $"{item.product?.product_model}"
                        );

                    table.Cell()
                        .Element(CellStyle)
                        .Text(
                            item.return_reason
                            ?? "-"
                        );

                    table.Cell()
                        .Element(CellStyle)
                        .AlignRight()
                        .Text(

                            $"₱{item.unit_cost:N2}"
                        );
                }
            });
        }



        // =====================================
        // TOTALS
        // =====================================

        private void BuildTotals(
            IContainer container)
        {
            container.Width(250)
                .Border(1)
                .BorderColor(
                    Colors.Grey.Lighten2
                )
                .Padding(10)
                .Column(column =>
                {
                    column.Item()
                        .Row(row =>
                        {
                            row.RelativeItem()
                                .Text(
                                    "Total Items"
                                )
                                .SemiBold();

                            row.ConstantItem(80)
                                .AlignRight()
                                .Text(
                                    _return.total_items
                                        .ToString()
                                );
                        });

                    column.Item()
                        .Row(row =>
                        {
                            row.RelativeItem()
                                .Text(
                                    "Shipping Cost"
                                )
                                .SemiBold();

                            row.ConstantItem(80)
                                .AlignRight()
                                .Text(

                                    $"₱{_return.shipping_cost:N2}"
                                );
                        });

                    column.Item()
                        .PaddingTop(5)
                        .Row(row =>
                        {
                            row.RelativeItem()
                                .Text(
                                    "Total Amount"
                                )
                                .Bold();

                            row.ConstantItem(80)
                                .AlignRight()
                                .Text(

                                    $"₱{_return.total_amount:N2}"
                                )
                                .Bold();
                        });
                });
        }



        // =====================================
        // SIGNATURE
        // =====================================

        private void BuildSignature(
            IContainer container)
        {
            container.Row(row =>
            {
                row.RelativeItem()
                    .Column(column =>
                    {
                        column.Item()
                            .PaddingBottom(25)
                            .Text("");

                        column.Item()
                            .LineHorizontal(1);

                        column.Item()
                            .AlignCenter()
                            .Text(
                                "Prepared By"
                            )
                            .SemiBold();
                    });



                row.RelativeItem()
                    .Column(column =>
                    {
                        column.Item()
                            .PaddingBottom(25)
                            .Text("");

                        column.Item()
                            .LineHorizontal(1);

                        column.Item()
                            .AlignCenter()
                            .Text(
                                "Approved By"
                            )
                            .SemiBold();
                    });



                row.RelativeItem()
                    .Column(column =>
                    {
                        column.Item()
                            .PaddingBottom(25)
                            .Text("");

                        column.Item()
                            .LineHorizontal(1);

                        column.Item()
                            .AlignCenter()
                            .Text(
                                "Received By Supplier"
                            )
                            .SemiBold();
                    });
            });
        }



        // =====================================
        // CELL STYLE
        // =====================================

        private static IContainer CellStyle(
            IContainer container)
        {
            return container
                .BorderBottom(1)
                .BorderColor(
                    Colors.Grey.Lighten2
                )
                .PaddingVertical(6)
                .PaddingHorizontal(4);
        }
    }
}