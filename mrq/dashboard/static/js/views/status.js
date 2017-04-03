define(["jquery", "underscore", "views/generic/datatablepage", "models", "moment"],function($, _, DataTablePage, Models, moment) {

  return DataTablePage.extend({

    el: '.js-page-status',

    template:"#tpl-page-status",

    events: {
      "click .js-datatable-filters-submit": "filterschanged"
    },

    initFilters: function () {
      this.filters = {
        "status": this.options.params.status || "",
        "jobs": this.options.params.jobs || ""
      };
    },

    setOptions: function (options) {
      this.options = options;
      this.initFilters();
      this.flush();
    },

    filterschanged: function (evt) {
      var self = this;

      if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
      }

      _.each(self.filters, function (v, k) {
        self.filters[k] = self.$(".js-datatable-filters-" + k).val();
      });

      window.location = "/#status?" + $.param(self.filters, true).replace(/\+/g, "%20");
    },

    renderDatatable:function() {
      var self = this;
      this.unbindFilterChange();
      var datatableConfig = self.getCommonDatatableConfig("status");

      _.extend(datatableConfig, {
        "aoColumns": [

          {
            "sTitle": "Status",
            "sClass": "col-status",
            "sType":"string",
            "sWidth":"150px",
            "mData":function(source, type/*, val*/) {
              return "<a href='/#jobs?status="+source._id+"'>"+source._id+"</a>";
            }
          },
          {
            "sTitle": "Jobs",
            "sClass": "col-jobs",
            "sType":"numeric",
            "sWidth":"120px",
            "mData":function(source, type/*, val*/) {
              var cnt = (source.jobs || 0);
              if (type == "display") {
                return "<a href='/#jobs?status="+source._id+"'>"+cnt+"</a>"
                 + "<br/>"
                 + '<span class="inlinesparkline" values="'+self.addToCounter("index.status."+source._id, cnt, 50).join(",")+'"></span>';
              } else {
                return cnt;
              }
            }
          },
          {
            "sTitle": "Speed",
            "sClass": "col-eta",
            "sType":"numeric",
            "mData":function(source, type, val) {
              return (Math.round(self.getCounterSpeed("index.status."+source._id) * 100) / 100) + " jobs/second";
            }
          },
          {
            "sTitle": "ETA",
            "sClass": "col-eta",
            "sType":"numeric",
            "mData":function(source, type, val) {
              return self.getCounterEta("index.status."+source._id, source.jobs || 0);
            }
          }

        ],
        "fnDrawCallback": function (oSettings) {

          _.each(oSettings.aoData,function(row) {
            var oData = row._aData;

            $(".col-jobs .inlinesparkline", row.nTr).sparkline("html", {"width": "100px", "height": "30px", "defaultPixelsPerValue": 1});

          });
        },
        "aaSorting":[ [0,'asc'] ],
      });

      this.initDataTable(datatableConfig);

    }
  });

});
