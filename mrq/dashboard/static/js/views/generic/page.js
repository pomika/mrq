define(["backbone", "underscore", "jquery", "moment", "daterangepicker"],function(Backbone, _, $, moment) {

  /**
   * A generic page, that can have sub-pages.
   *
   */
  return Backbone.View.extend({


    alwaysRenderOnShow:false,
    timeFilterStarted: null,

    // This will be called once before the first render only.
    init:function() {
      this.counters = {};
      this.initTimeFilter();
    },
    initok:false,

    initTimeFilter: function () {
      var self = this;
      this.timeFilterStarted = moment();
      var last15MinutesRange = this.timeFilter.getLastXMinutes(15);
      var last30MinutesRange = this.timeFilter.getLastXMinutes(30);
      var todayRange = this.timeFilter.getTodayRange();
      var yesterdayRange = this.timeFilter.getYesterdayRange();
      var last7DaysRange = this.timeFilter.getLastXDays(7);
      var last30DaysRange = this.timeFilter.getLastXDays(30);
      var thisMonthRange = this.timeFilter.getThisMonthRange();
      var lastMonthRange = this.timeFilter.getLastMonthRange();
      var thisYearRange = this.timeFilter.getThisYearRange();

      var lastRangeUsed = this.cookieManager.getCookie("daterange");
      var startRange = thisYearRange;
      if(lastRangeUsed == "Today")
        startRange = todayRange;
      else if(lastRangeUsed == "Last 15 Minutes")
        startRange = last15MinutesRange;
      else if(lastRangeUsed == "Last 30 Minutes")
        startRange = last30MinutesRange;
      else if(lastRangeUsed == "Yesterday")
        startRange = yesterdayRange;
      else if(lastRangeUsed == "Last 7 Days")
        startRange = last7DaysRange;
      else if(lastRangeUsed == "Last 30 Days")
        startRange = last30DaysRange;
      else if(lastRangeUsed == "This Month")
        startRange = thisMonthRange;
      else if(lastRangeUsed == "Last Month")
        startRange = lastMonthRange;
      else if(lastRangeUsed == "This Year")
        startRange = thisYearRange;

      var val = Date.parse(startRange.start.toDate().toUTCString()) + ' - ' + Date.parse(startRange.end.toDate().toUTCString());
      self.cookieManager.setCookie("daterange-val", val, 365);

      $('#time_filter').daterangepicker({
        "timePicker24Hour": true,
        "timePicker": true,
        "locale": {
          "format": "DD/MM/YYYY HH:mm",
        },
        "ranges": {
          "Last 15 Minutes": [
            last15MinutesRange.start,
            last15MinutesRange.end
          ],
          "Last 30 Minutes": [
            last30MinutesRange.start,
            last30MinutesRange.end
          ],
          "Today": [
            todayRange.start,
            todayRange.end
          ],
          "Yesterday": [
            yesterdayRange.start,
            yesterdayRange.end
          ],
          "Last 7 Days": [
            last7DaysRange.start,
            last7DaysRange.end
          ],
          "Last 30 Days": [
            last30DaysRange.start,
            last30DaysRange.end
          ],
          "This Month": [
            thisMonthRange.start,
            thisMonthRange.end
          ],
          "Last Month": [
            lastMonthRange.start,
            lastMonthRange.end
          ],
          "This Year": [
            thisYearRange.start,
            thisYearRange.end
          ]
        },
        "startDate": startRange.start,
        "endDate": startRange.end,
      }, function (start, end, label) {
        var val; //Date.parse(start.toDate().toUTCString()) + ' - ' + Date.parse(end.toDate().toUTCString());
        var now = Date.parse(moment().toDate().toUTCString());
        var momentStarted = Date.parse(self.timeFilterStarted.toDate().toUTCString());
        var diff = now - momentStarted;
        if(label != "Custom Range") {
          $('#time_filter span').html(label);

          var startDate = Date.parse(start.toDate().toUTCString());

          var endDate = Date.parse(end.toDate().toUTCString());

          startDate += diff;
          endDate += diff;
          val = startDate + ' - ' + endDate;
        }
        else {
          $('#time_filter span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
        }

        self.cookieManager.setCookie("daterange", label, 365);

        self.cookieManager.setCookie("daterange-val", val, 365);
        $('#time_filter').trigger('change');
      });
      if(lastRangeUsed != "Custom Range")
        $('#time_filter span').html(lastRangeUsed);
      else
        $('#time_filter span').html(startRange.start.format('MMMM D, YYYY') + ' - ' + startRange.end.format('MMMM D, YYYY'));
    },

    addChildPage: function(id, childPage) {
      if (!this.childPages) this.childPages = {};

      if (this.childPages[id]) this.removeChildPage(id);

      childPage.parentPage = this;
      this.childPages[id] = childPage;
      childPage.setApp(this.app);
    },

    setApp:function(app) {
      this.app = app;
      //add to all children
      _.each(this.childPages,function(cp) {
        cp.setApp(app);
      });
    },

    setActiveMenu:function(menu) {
      $("#in-sub-nav a").removeClass("active");
      $("#in-sub-nav a.js-nav-"+menu).addClass("active");
    },

    setOptions:function(options) {
      this.options = options;
    },

    showChildPage: function(childPageId, options) {

      var ret = false;

      this.currentChildPage = childPageId;

      _.each(this.childPages, function(page, id) {
        if (id != childPageId) {
          if (!options || !options.modal) {
            page.hide();
          }
        } else {
          ret = page;
        }
      });

      if (options && options.options) {
        ret.setOptions(options.options);
      }
      if (options && options.forceRender) {
        ret.flush();
      }
      if (options && options.modal) {
        ret.showModal();
      } else {
        ret.show();
      }

      return ret;
    },

    removeChildPage:function(pageId) {
      if (!this.childPages[pageId]) return;
      this.childPages[pageId].removeAllChildPages();
      this.childPages[pageId].delegateEvents({});
      this.childPages[pageId].hide();
      this.childPages[pageId].remove();
      delete this.childPages[pageId];
    },

    removeAllChildPages:function() {
      if (this.childPages && _.size(this.childPages)) {
        _.each(_.keys(this.childPages),function(k) {
          this.removeChildPage(k);
        },this);
      }
    },

    showModal: function() {
      if (!this.initok) {
        this.init();
        this.initok = true;
      }
      if (!this._rendered || this.alwaysRenderOnShow) {
        this._rendered = true;
        this.render();

      }
      $(this.el).show().modal({
        keyboard: true,
        backdrop: true,
        show: true
      });
    },

    show: function() {
      if (!this.initok) {
        this.init();
        this.initok = true;
      }
      if (!this._rendered || this.alwaysRenderOnShow) {
        this._rendered = true;
        this.render();

      }

      if (this.menuName) this.setActiveMenu(this.menuName);

      this.trigger("show");
      $(this.el).fadeIn();

    },

    hide: function() {
      $(this.el).hide();
      this.trigger("hide");
    },

    remove:function() {
      this.hide();
    },

    flush:function() {
      //If we're currently shown, re-render now
      if ($(this.el)[0].style.display!="none") {
        this.render();

      //If not, queue for rendering at the next show();
      } else {
        this._rendered = false;
      }
    },


    // Used mainly to generate sparklines across refreshes
    addToCounter: function(name, newvalue, maxvalues) {

      if (!this.counters[name]) this.counters[name] = [];

      this.counters[name].push({
        "date": +new Date(),
        "value": newvalue
      });

      if (this.counters[name].length > maxvalues) {
        this.counters[name].shift();
      }

      return _.pluck(this.counters[name], "value");

    },

    getCounterSpeed: function(name) {

      if ((this.counters[name] || []).length < 2) return 0;

      var last = this.counters[name].length - 1;
      var interval = (this.counters[name][last]["date"] - this.counters[name][0]["date"]) / 1000;
      var diff = this.counters[name][last]["value"] - this.counters[name][0]["value"];

      if (diff == 0) return 0;

      return diff / interval;

    },

    getCounterEta: function(name, total) {

      var speed = this.getCounterSpeed(name);

      if (speed >= 0) {
        return "N/A";
      } else {
        return moment.duration(total * 1000 / speed).humanize();
      }

    },

    renderTemplate:function(options,tpl,el) {

      //console.log(el,this.$el,app.templates[tpl || this.template]);
      (el||this.$el).html(_.template($(this.template).html())(_.defaults(options||{},{
        _: _,
        app: this.app
      })));
    },

    render:function() {
      return this;
    },

    timeFilter: {
      getLastXMinutes: function(x){
        return {
          start: moment().subtract(15, 'minutes'),
          end: moment()
        };
      },
      getTodayRange: function(){
        return {
          start: moment().startOf('day'),
          end: moment().endOf('day')
        };
      },
      getYesterdayRange: function(){
        return {
          start: moment().subtract(1, 'days').startOf('day'),
          end: moment().subtract(1, 'days').endOf('day')
        };
      },
      getLastXDays: function(x){
        return {
          start: moment().subtract(x, 'days').startOf('day'),
          end: moment().endOf('day')
        };
      },
      getThisMonthRange: function(){
        return {
          start: moment().startOf('month').startOf('day'),
          end: moment().endOf('month').endOf('day')
        };
      },
      getLastMonthRange: function(){
        return {
          start: moment().subtract(1, 'month').startOf('month').startOf('day'),
          end: moment().subtract(1, 'month').endOf('month').endOf('day')
        };
      },
      getThisYearRange: function(){
        return {
          start: moment().startOf('year'),
          end: moment().endOf('year')
        };
      },
    },

    cookieManager: {
      setCookie: function (cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
      },
      getCookie: function (cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0) == ' ') {
            c = c.substring(1);
          }
          if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
          }
        }
        return "";
      }
    },

    bindTimeFilterChange: function(self){
      $('#time_filter').unbind( 'change' ).bind( 'change', function() {
        self.filterschanged();
      });

    },

    unbindFilterChange: function(){
      $('#time_filter').unbind( 'change' );
    },

  });

});
