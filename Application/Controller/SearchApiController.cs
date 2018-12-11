using Examine;
using Examine.Providers;
using Examine.SearchCriteria;
using App_Plugins.LPDescendantsSearchListViewLayout.Application.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using Umbraco.Core.Models;
using Umbraco.Core.Services;
using Umbraco.Web;
using Umbraco.Web.WebApi;

namespace App_Plugins.LPDescendantsSearchListViewLayout.Application.Controllers
{
    public class SearchApiController : UmbracoApiController
    {
        public IEnumerable<ItemsViewModel> GetAllItems(string id,  string name)
        {

            IContentService contentService = ApplicationContext.Services.ContentService;
            var currentNodeParent = contentService.GetById(int.Parse(id));
            var children = currentNodeParent.Children();
            var desc = currentNodeParent.Descendants();
            List<IContent> descendants = new List<IContent>();
            var model = new List<ItemsViewModel>();
            if (!string.IsNullOrEmpty(name))
                descendants.AddRange(desc.Where(i => i.Name.ToLower().Trim().Contains(name.ToLower().Trim())));
            else
                descendants.AddRange(children);
            
            model.AddRange(descendants.Select(i => new ItemsViewModel()
            {
                id = i.Id.ToString(),
                name = i.Name,
                owner = i.GetCreatorProfile().Name,
                updateDate = i.UpdateDate.ToString(),
                parentId = i.ParentId.ToString(),
                icon = Services.ContentTypeService.GetContentType(i.ContentType.Id).Icon,
                isPublished = (i.Published ? 1 : 0).ToString()
            }));
            return model;
        }

        [HttpGet]
        public async Task<HttpResponseMessage> GetAll(string id, string name)
        {
            var model = GetAllItems(id, name);
            return Request.CreateResponse(HttpStatusCode.OK,
                model,
                "application/json");
        }
    }

   

}
