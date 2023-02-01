(function($) {
  var RangeRover = function () {
    this.options = {
      range: false,
      mode: 'plain',
      autocalculate: true,
      color: '#3498db',
      step: 1,
      vLabels: false
    };
    this.coordinates = {
      startSkate: {
        min: 0,
        max: 0
      },
      endSkate: {
        min: 0,
        max: 0
      }
    };
    this.selector = null;
    this.startSkate = null;
    this.endSkate = null;
    this.progressBar = null;
    // whether mouse/finger pressed or not
    this.enabledSkater = null;
    this.selected = {
      start: {
        value: 0
      }
    };
    this.setEvendHandlers = function () {
      var self = this;

      self.startSkate.on('mousedown touchstart', function() {
        self.enabledSkater = 'startSkate';
      });

      if (self.options.range) {
        self.endSkate.on('mousedown touchstart', function() {
          self.enabledSkater = 'endSkate';
        });
      }

      $(document).on('mouseup touchend', function() {
        self.checkSelection(null);
        self.enabledSkater = null;
      });

      $(document).on('mousemove touchmove', function (e) {
        if (self.enabledSkater) {
          self.checkSelection(null);
          var positionToScroll = e.pageX - self.selector.offset().left;

          if (positionToScroll < self.coordinates[self.enabledSkater].min) {
            // use slider's left border as a min position
            positionToScroll = self.coordinates[self.enabledSkater].min;
          } else if (positionToScroll > self.coordinates[self.enabledSkater].max) {
            // use slider's right border as a max position
            positionToScroll = self.coordinates[self.enabledSkater].max;
          }
          // drag `skate` element if mouse/ finger pressed
          self[self.enabledSkater].css('left', positionToScroll);
        }
      });

      this.progressBar.on('click tap', function (e) {
        self.progressBarSelection(e.pageX);
      });
    };

    this.init = function () {
      var self = this;
      var progressBarContent = [];

      if (this.options.mode === 'plain') {
        self.options.data.size = 100;
        self.options.data = [this.options.data];
      }
      // add specific class to slider to use its width below
      self.selector.addClass('ds-container');
      if (self.options.autocalculate && this.options.mode === 'categorized') {
        RangeRover.autocalculateCategoriesSizes(self.options.data);
      }

      $.each(self.options.data, function(index, category) {
        // set category's percent size and background color to its div
        var exludedValuesPlain = category.exclude ? RangeRover.getExcludedValuesPlain(category) : [];
        var categoryContent = '<div class="ds-category" data-category="' + (category.id || category.name) + '" style="width:' + category.size + '%;' + (category.color ? ('background:' + category.color) : '') + '"><span class="ds-category-title">' + (category.name ? category.name : '' ) + '</span><span class="ds-category-start">' + category.start + '</span>';

        var valuesCount = category.end - category.start - exludedValuesPlain.length;
        // calculate category px width
        var categoryWidth = self.selector.width() / 100 * category.size;
        //  calculate value's px width
        var valueWidth = categoryWidth / valuesCount;

        var j = 0;

        // set first element as a default
        self.selected.start.value = category.start;
        if (self.options.mode === 'categorized') {
          self.selected.start.category = (category.id || category.name);
        }

        for (var i = category.start; i < category.end; i++) {
          j = i;
          if (i + self.options.step - 1 > category.end) {
              j = category.end;
          }
          if (~exludedValuesPlain.indexOf(i)) {
              continue;
          }

          categoryContent += '<span class="ds-item" data-year="' + j + '" style="width:' + (valueWidth * self.options.step) + 'px">' + (self.options.vLabels && i != category.start && i != category.end ? i : '') + '</span>';
          i = i + self.options.step - 1;
        }
        if (index === self.options.data.length - 1) {
          categoryContent += '<span class="ds-category-end">' + category.end + '</span>';
          if (self.options.range) {
            self.selected.end = {};
            self.selected.end.value = category.end;
            if (self.options.mode === 'categorized') {
              self.selected.end.category = (category.id || category.name);
            }
          }
        }
        categoryContent += '</div>';
        progressBarContent.push(categoryContent);
      });

      // put progressBar's with ranges, skate elements to container
      var progressBarHtml = '<div class="ds-skate"><span class="ds-skate-year-mark">' + self.selected.start.value + '</span></div><div class="ds-progress">' + progressBarContent.join('') + ' </div>';
      if (this.options.range) {
        progressBarHtml += '<div class="ds-end-skate"><span class="ds-skate-year-mark">' + self.selected.end.value + '</span></div>'
      }

      this.selector.html(progressBarHtml);
      this.startSkate = this.selector.find('.ds-skate');
      if (this.options.range) {
        this.endSkate = this.selector.find('.ds-end-skate');
      }
      this.progressBar = this.selector.find('.ds-progress');
      if (this.options.color) {
        this.progressBar.css('background', this.options.color);
      }
      // prevent browser native drag
      this.selector.attr("ondragstart", 'return false');
      // calculate min left and max right coordinates to use as a border of slider
      this.calculateAndSetCoordinates();
      this.setEvendHandlers();
    };

    this.checkSelection = function (selectedPosition) {
      var selectedValue, selectedCategory;
      var self = this;
      var isTriggeredFromProgressBar = !!selectedPosition;
      var skateChanged = null;

      if (isTriggeredFromProgressBar) {
        if (!self.options.range) {
          skateChanged = 'start';
        }
        if (self.options.range && parseInt(self.endSkate.css('left'), 10) - selectedPosition < selectedPosition - parseInt(self.startSkate.css('left'), 10)) {
          self.endSkate.css('left', selectedPosition);
          skateChanged = 'end';
        } else {
          self.startSkate.css('left', selectedPosition);
          skateChanged = 'start';
        }
      } else {
        if (!self[self.enabledSkater]) {
          return;
        }
        selectedPosition = parseInt(self[self.enabledSkater].css('left'), 10);
      }
      if (self.enabledSkater === 'endSkate' && selectedPosition === this.coordinates.endSkate.max) {
        if (self.options.mode === 'categorized') {
          selectedValue = self.options.data[self.options.data.length - 1].end;
          selectedCategory = self.options.data[self.options.data.length - 1].name;
        } else {
          selectedValue = self.options.data[0].end;
        }
      }
      // loop through all items to find selected one
      if (!selectedValue) {
        self.progressBar.find('.ds-item').each(function(index, item) {
          item = $(item);
          var itemLeftOffset = item.offset().left - self.selector.offset().left;
          if (itemLeftOffset <= selectedPosition && itemLeftOffset + item.width() > selectedPosition) {
            selectedValue = +item.attr('data-year');
            selectedCategory = item.parent().attr('data-category');
            return false;
          }
        });
      }
      skateChanged = skateChanged || (self.enabledSkater ? self.enabledSkater.split('Skate')[0] : null);
      // update selectedValue and call onChange if selectedYear has been changed

      if (selectedValue && selectedValue !== this.selected[skateChanged].value) {
        self.selected[skateChanged].value = +selectedValue;

        if (self.options.mode === 'categorized') {
          self.selected[skateChanged].category = selectedCategory;
        }
        self.updateSelectedLabels();
        if (self.options.onChange && typeof self.options.onChange === 'function') {
          self.onChange();
        }
      }
    };

    this.onChange = function () {
      this.options.onChange(this.selected);
    };

    this.progressBarSelection = function (pageX) {
      this.checkSelection(pageX - $('.ds-container').offset().left);
    };

    this.updateSelectedLabels = function () {
      this.updateCoordinates();
      this.startSkate.children('.ds-skate-year-mark').html(this.selected.start.value);

      if (this.options.range) {
        this.endSkate.children('.ds-skate-year-mark').html(this.selected.end.value);
      }
    };

    this.updateCoordinates = function () {
      if (this.options.range) {
        this.coordinates.startSkate.max = parseInt(this.endSkate.css('left'), 10);
        this.coordinates.endSkate.min = parseInt(this.startSkate.css('left'), 10);
      }
    };

    this.calculateAndSetCoordinates = function () {
      this.coordinates.startSkate.max = this.selector.width() - this.startSkate.width() - parseInt(this.startSkate.css('border-width'), 10);

      if (this.options.range) {
        this.coordinates.endSkate.max = this.selector.width() - this.endSkate.width() - parseInt(this.endSkate.css('border-width'), 10);
      }
    };

    this.select = function (value) {
      var mainLeft = $('.ds-container').offset().left;
      if (typeof value === 'object') {   
        if (value.start) {
          this.selected.start.value = value.start;
          var element = $('.ds-item[data-year="' + value.start + '"]');
          if (!element.length) {
            console.warn('RangeRover -> select: element `' + value.start + '` is not found.');
            return this;
          }
          var leftPosition = element.offset().left;
          this.startSkate.css('left', leftPosition - mainLeft);
        }
    
        if (value.end) {
          this.selected.end.value = value.start;
          var element = $('.ds-item[data-year="' + value.start + '"]');
          if (!element.length) {
            console.warn('RangeRover -> select: element `' + value.start + '` is not found.');
            return this;
          }
          var leftPosition = element.offset().left;
          this.endSkate.css('left', leftPosition - mainLeft);
        }
      } else {
        this.selected.start.value = value;
        var element = $('.ds-item[data-year="' + value + '"]');
        if (!element.length) {
          console.warn('RangeRover -> select: element `' + value + '` is not found.');
          return this;
        }
        var leftPosition = element.offset().left;
        
        this.startSkate.css('left', leftPosition - mainLeft);
      }
      this.updateSelectedLabels();
    }
  };

  RangeRover.autocalculateCategoriesSizes = function (categories) {
    var totalCount = categories.reduce(function(prev, next, index) {
      if (index === 1) {
        return (prev.end - prev.start) + (next.end - next.start);
      } else {
        return prev + (next.end - next.start);
      }
    });
    return categories.map(function(e) {
        e.size = 100 / totalCount * (e.end - e.start);
    });
  };

  RangeRover.getExcludedValuesPlain = function (category) {
    var plainYears = [];
    $.each(category.exclude, function (index, y) {
      if (typeof y === 'object' && y.start && y.end) {
        for (var i = y.start; i <= y.end; i++) {
          plainYears.push(i);
        }
      } else {
        plainYears.push(y);
      }
    });
    return plainYears;
  };

  RangeRover.isArray = function (obj) {
		if (Object.prototype.toString.call(obj) === '[object Array]') {
			return true;
		}
	};

  $.fn.extend({
    rangeRover: function (options) {
      var slider = new RangeRover();
      slider.options = $.extend(slider.options, options);

      if (!slider.options.data || RangeRover.isArray(slider.options.data) && !slider.options.data.length) {
        console.warn('RangeRover -> please provide data');
        return;
      }

      if (slider.options.mode === 'plain' && (RangeRover.isArray(slider.options.data) || typeof slider.options.data != 'object')) {
        console.warn('RangeRover -> `data` must be object in `plain` mode');
        return;
      }

      if (slider.options.mode === 'categorized' && !RangeRover.isArray(slider.options.data)) {
        console.warn('RangeRover -> `data` must be array in `categorized` mode');
        return;
      }

      slider.selector = $(this);
      slider.init();

      if (options.onInit && typeof options.onInit === 'function') {
        options.onInit();
      }
      return slider;
    }
  });
})(jQuery);
