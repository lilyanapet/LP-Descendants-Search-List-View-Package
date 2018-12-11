using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace App_Plugins.LPDescendantsSearchListViewLayout.Application.Models
{
    public class ItemsViewModel
    {
        public string id { get; set; }
        public string name { get; set; }
        public string owner { get; set; }
        public string updateDate { get; set; }
        public string parentId { get; set; }
        public string icon { get; set; }
        public string isPublished { get; set; }
    }
}
