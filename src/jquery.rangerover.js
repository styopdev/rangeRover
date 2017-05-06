(function($) {
  var RangeRover = function () {
    this.options = {
      eras: [],
      range: false,
      mode: null,
      autocalculate: true
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
      start: 0,
      end: 0
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
      var eras = [];
      // add specific class to slider to use its width below
      this.selector.addClass('ds-container');
      if (this.options.autocalculate) {
        RangeRover.autocalculateErasSizes(this.options.eras);
      }
      console.log('this.options.eras', this.options.eras);
      $.each(this.options.eras, function(index, era) {
        // set eras percent size and background color to its div
        var eraContent = '<div class="ds-era" data-era="' + index + '" style="width:' + era.size + '%; background-color:' + era.color + '"><span class="ds-era-title">' + era.name + '</span><span class="ds-era-start">' + era.start + '</span>';
        var exludedYearsPlain = era.exclude ? DateSlider.getExcludedYearsPlain(era) : [];

        var yearsCount = era.end - era.start - exludedYearsPlain.length;
        // calculate era px with
        var eraWidth = self.selector.width() / 100 * era.size;
        //  calculate year px width
        var yearWidth = eraWidth / yearsCount;

        for (var i = era.start; i < era.end; i++) {
          if (~exludedYearsPlain.indexOf(i)) {
              continue;
          }
          // set first element as a default
          if (!self.selected.start) {
            self.selected.start = i;
          }
          eraContent += '<span class="ds-era-item" data-year="' + i + '" style="width:' + yearWidth + 'px"></span>';
        }
        if (index === self.options.eras.length - 1) {
          eraContent += '<span class="ds-era-end">' + era.end + '</span>';
          self.selected.end = era.end;
        }
        eraContent += '</div>';
        eras.push(eraContent);

      });
      // put progressBar's with ranges, skate elements to container
      var progressBarHtml = '<div class="ds-skate"><span class="ds-skate-year-mark">' + self.selected.start + '</span></div><div class="ds-progress">' + eras.join('') + ' </div>';
      if (this.options.range) {
        progressBarHtml += '<div class="ds-end-skate"><span class="ds-skate-year-mark">' + self.selected.end + '</span></div>'
      }

      this.selector.html(progressBarHtml);
      this.startSkate = this.selector.find('.ds-skate');
      if (this.options.range) {
        this.endSkate = this.selector.find('.ds-end-skate');
      }
      this.progressBar = this.selector.find('.ds-progress');
      // prevent browser native drag
      this.selector.attr("ondragstart", 'return false');
      // calculate min left and max right coordinates to use as a border of slider
      this.calculateAndSetCoordinates();
      this.setEvendHandlers();
    };

    this.checkSelection = function (selectedPosition) {
      var selected;
      var self = this;
      var isTriggeredFromProgressBar = !!selectedPosition;
      var skateChanged = null;

      if (isTriggeredFromProgressBar) {
        if (!this.options.range) {
          skateChanged = 'start';
        }
        if (this.options.range && parseInt(this.endSkate.css('left'), 10) - selectedPosition < selectedPosition - parseInt(this.startSkate.css('left'), 10)) {
          this.endSkate.css('left', selectedPosition);
          skateChanged = 'end';
        } else {
          this.startSkate.css('left', selectedPosition);
          skateChanged = 'start';
        }
      } else {
        if (!this[this.enabledSkater]) {
          return;
        }
        selectedPosition = parseInt(this[this.enabledSkater].css('left'), 10);
      }
      // loop through all items to find selected one
      this.progressBar.find('.ds-era-item').each(function(index, item) {
        var itemLeftOffset = $(item).offset().left - self.selector.offset().left;
        if (itemLeftOffset <= selectedPosition && itemLeftOffset + $(item).width() > selectedPosition) {
          selected = +$(item).attr('data-year');
          return false;
        }
      });
      skateChanged = skateChanged || (this.enabledSkater ? this.enabledSkater.split('Skate')[0] : null);
      // update selectedYear and call onChange if selectedYear has been changed

      if (selected && selected !== this.selected[skateChanged]) {
        this.selected[skateChanged] = +selected;
        this.updateSelectedYear();
        if (this.options.onChange && typeof this.options.onChange === 'function') {
          this.onChange();
        }
      }
    };

    this.onChange = function () {
      if (this.options.range) {
        this.options.onChange(this.selected);
      } else {
        this.options.onChange(this.selected.start);
      }
    };

    this.progressBarSelection = function (pageX) {
      this.checkSelection(pageX - $('.ds-container').offset().left);
    };

    this.updateSelectedYear = function () {
      this.updateCoordinates();
      this.startSkate.children('.ds-skate-year-mark').html(this.selected.start);

      if (this.options.range) {
        this.endSkate.children('.ds-skate-year-mark').html(this.selected.end);
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

    this.select = function (year) {
      if (year !== this.selectedYear) {
        var yearElement = $('.ds-era-item[data-year="' + year + '"]');
        if (!yearElement.length) {
          console.warn('DateSlider -> select: element `' + year + '` is not found.');
          return this;
        }
        var leftPosition = yearElement.offset().left;
        this.skate.css('left', leftPosition);
        this.selectedYear = year;
        this.updateSelectedYear();

        if (this.options.onChange && typeof this.options.onChange === 'function') {
          this.onChange();
        }
      }
      return this;
    }
  };

  RangeRover.autocalculateErasSizes = function (eras) {
    var totalCount = eras.reduce(function(prev, next, index) {
      if (index === 1) {
        return (prev.end - prev.start) + (next.end - next.start);
      } else {
        console.log('prev', prev);
        return prev + (next.end - next.start);
      }
    });
    return eras.map(function(e) {
        e.size = 100 / totalCount * (e.end - e.start);
    });
  };

  RangeRover.getExcludedYearsPlain = function (era) {
    var plainYears = [];
    $.each(era.exclude, function (index, y) {
      if (typeof y === 'object' && y.start && y.end) {
        for (var i = y.start; i <= y.end; i++) {
          plainYears.push(i);
        }
      } else {
        plainYears.push(y);
      }
    });
    return plainYears;
  }

  $.fn.extend({
    rangeRover: function (options) {
      var slider = new RangeRover();
      slider.options = $.extend(slider.options, options);
      slider.selector = $(this);
      slider.init();

      if (options.onInit && typeof options.onInit === 'function') {
        options.onInit();
      }
      return slider;
    }
  });
})(jQuery);
