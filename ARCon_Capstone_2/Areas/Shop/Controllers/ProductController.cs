using Microsoft.AspNetCore.Mvc;

[Area("Shop")]
public class ProductController : Controller
{
    public IActionResult Details(int id)
    {
        ViewBag.ProductId = id;
        return View();
    }
}
