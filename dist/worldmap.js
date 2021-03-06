'use strict';

System.register(['lodash', './libs/leaflet', './libs/leaflet-heat'], function (_export, _context) {
  "use strict";

  var _, L, _createClass, tileServers, WorldMap;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_libsLeaflet) {
      L = _libsLeaflet.default;
    }, function (_libsLeafletHeat) {}],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      tileServers = {
        'CartoDB Positron': { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd' },
        'CartoDB Dark': { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd' }
      };

      WorldMap = function () {
        function WorldMap(ctrl, mapContainer) {
          _classCallCheck(this, WorldMap);

          this.ctrl = ctrl;
          this.mapContainer = mapContainer;
          this.createMap();
          this.circles = {};
          this.heatData = [];
        }

        _createClass(WorldMap, [{
          key: 'createMap',
          value: function createMap() {
            var mapCenter = window.L.latLng(parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude));
            this.map = window.L.map(this.mapContainer, { worldCopyJump: true, center: mapCenter }).fitWorld().zoomIn(parseInt(this.ctrl.panel.initialZoom, 10));
            this.map.panTo(mapCenter);

            var selectedTileServer = tileServers[this.ctrl.tileServer];
            window.L.tileLayer(selectedTileServer.url, {
              maxZoom: 18,
              subdomains: selectedTileServer.subdomains,
              reuseTiles: true,
              detectRetina: true,
              attribution: selectedTileServer.attribution
            }).addTo(this.map);
          }
        }, {
          key: 'createLegend',
          value: function createLegend() {
            var _this = this;

            this.legend = window.L.control({ position: 'bottomleft' });
            this.legend.onAdd = function () {
              _this.legend._div = window.L.DomUtil.create('div', 'info legend');
              _this.legend.update();
              return _this.legend._div;
            };

            this.legend.update = function () {
              var thresholds = _this.ctrl.data.thresholds;
              var legendHtml = '';
              legendHtml += '<i style="background:' + _this.ctrl.panel.colors[0] + '"></i> ' + '&lt; ' + thresholds[0] + '<br>';
              for (var index = 0; index < thresholds.length; index += 1) {
                legendHtml += '<i style="background:' + _this.getColor(thresholds[index] + 1) + '"></i> ' + thresholds[index] + (thresholds[index + 1] ? '&ndash;' + thresholds[index + 1] + '<br>' : '+');
              }
              _this.legend._div.innerHTML = legendHtml;
            };
            this.legend.addTo(this.map);
          }
        }, {
          key: 'drawOverlay',
          value: function drawOverlay() {
            switch (this.ctrl.data.mapType) {
              case "circle":
                this.clearHeat();
                this.drawCircles();
                break;
              case "heat":
                this.clearCircles();
                this.drawHeat();
                break;
              default:
                break;
            }
          }
        }, {
          key: 'needToRedrawCircles',
          value: function needToRedrawCircles(data) {
            var nCirc = _.size(this.circles);
            if (nCirc === 0 && data.length > 0) return true;
            if (nCirc !== data.length) return true;
            var locations = new Set(_.map(_.map(this.circles, 'options'), 'location'));
            var dataPoints = new Set(_.map(data, 'key'));
            return !_.isEqual(locations, dataPoints);
          }
        }, {
          key: 'filterEmptyAndZeroValues',
          value: function filterEmptyAndZeroValues(data) {
            var _this2 = this;

            return _.filter(data, function (o) {
              return !(_this2.ctrl.panel.hideEmpty && _.isNil(o.value)) && !(_this2.ctrl.panel.hideZero && o.value === 0);
            });
          }
        }, {
          key: 'clearCircles',
          value: function clearCircles() {
            if (this.circlesLayer) {
              this.circlesLayer.clearLayers();
              this.removeCircles(this.circlesLayer);
              this.circles = {};
            }
          }
        }, {
          key: 'clearHeat',
          value: function clearHeat() {
            if (this.heatLayer) {
              this.map.removeLayer(this.heatLayer);
            }
            this.heatData = [];
          }
        }, {
          key: 'drawCircles',
          value: function drawCircles() {
            var data = this.filterEmptyAndZeroValues(this.ctrl.data);
            if (this.needToRedrawCircles(data)) {
              this.clearCircles();
              this.createCircles(data);
            } else {
              this.updateCircles(data);
            }
          }
        }, {
          key: 'createCircles',
          value: function createCircles(data) {
            var _this3 = this;

            var circles = {};
            data.forEach(function (dataPoint) {
              if (!dataPoint.locationName) return;
              circles[dataPoint.key] = _this3.createCircle(dataPoint);
            });
            this.circlesLayer = this.addCircles(_.values(circles));
            this.circles = circles;
          }
        }, {
          key: 'updateCircles',
          value: function updateCircles(data) {
            var _this4 = this;

            data.forEach(function (dataPoint) {
              if (!dataPoint.locationName) return;

              var circle = _this4.circles[dataPoint.key];

              if (circle) {
                circle.setRadius(_this4.calcCircleSize(dataPoint.value || 0));
                circle.setStyle({
                  color: _this4.getColor(dataPoint.value),
                  fillColor: _this4.getColor(dataPoint.value),
                  fillOpacity: 0.5,
                  location: dataPoint.key
                });
                circle.unbindPopup();
                _this4.createPopup(circle, dataPoint.locationName, dataPoint.valueRounded);
              }
            });
          }
        }, {
          key: 'createCircle',
          value: function createCircle(dataPoint) {
            var circle = window.L.circleMarker([dataPoint.locationLatitude, dataPoint.locationLongitude], {
              radius: this.calcCircleSize(dataPoint.value || 0),
              color: this.getColor(dataPoint.value),
              fillColor: this.getColor(dataPoint.value),
              fillOpacity: 0.5,
              location: dataPoint.key
            });

            this.createPopup(circle, dataPoint.locationName, dataPoint.valueRounded);
            return circle;
          }
        }, {
          key: 'calcCircleSize',
          value: function calcCircleSize(dataPointValue) {
            var circleMinSize = parseInt(this.ctrl.panel.circleMinSize, 10) || 2;
            var circleMaxSize = parseInt(this.ctrl.panel.circleMaxSize, 10) || 30;

            if (this.ctrl.data.valueRange === 0) {
              return circleMaxSize;
            }

            var dataFactor = (dataPointValue - this.ctrl.data.lowestValue) / this.ctrl.data.valueRange;
            var circleSizeRange = circleMaxSize - circleMinSize;

            return circleSizeRange * dataFactor + circleMinSize;
          }
        }, {
          key: 'createPopup',
          value: function createPopup(circle, locationName, value) {
            var unit = value && value === 1 ? this.ctrl.panel.unitSingular : this.ctrl.panel.unitPlural;
            var label = (locationName + ': ' + value + ' ' + (unit || '')).trim();
            circle.bindPopup(label, { 'offset': window.L.point(0, -2), 'className': 'worldmap-popup', 'closeButton': this.ctrl.panel.stickyLabels });

            circle.on('mouseover', function onMouseOver(evt) {
              var layer = evt.target;
              layer.bringToFront();
              this.openPopup();
            });

            if (!this.ctrl.panel.stickyLabels) {
              circle.on('mouseout', function onMouseOut() {
                circle.closePopup();
              });
            }
          }
        }, {
          key: 'getColor',
          value: function getColor(value) {
            for (var index = this.ctrl.data.thresholds.length; index > 0; index -= 1) {
              if (value >= this.ctrl.data.thresholds[index - 1]) {
                return this.ctrl.panel.colors[index];
              }
            }
            return _.first(this.ctrl.panel.colors);
          }
        }, {
          key: 'rgb2hex',
          value: function rgb2hex(rgb) {
            rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
            return rgb && rgb.length === 4 ? "#" + ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) + ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) + ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : '';
          }
        }, {
          key: 'drawHeat',
          value: function drawHeat() {
            this.clearHeat();
            // build up the array to feed the heat layer
            var heatData = [];
            var minValue = _.min(_.map(this.ctrl.data, 'value'));
            var maxValue = _.max(_.map(this.ctrl.data, 'value'));

            this.ctrl.data.forEach(function (dataPoint) {
              if (!dataPoint.locationName) return;
              var normalizedValue = (dataPoint.value - minValue) / (maxValue - minValue);
              // let heatPoint = [dataPoint.locationLatitude, dataPoint.locationLongitude, normalizedValue];
              var heatPoint = [dataPoint.locationLatitude, dataPoint.locationLongitude, dataPoint.value];
              heatData.push(heatPoint);
            });

            var maxGrad = _.max(this.ctrl.data.thresholds);
            var minGrad = 0; //_.min(this.ctrl.data.thresholds);
            var mapMaxVal = maxGrad; //_.max([maxGrad,maxValue]);
            // gradient - color gradient config, e.g. {0.4: 'blue', 0.65: 'lime', 1: 'red'}
            var gradientData = {};
            gradientData[0] = this.rgb2hex(this.ctrl.panel.colors[0]);
            for (var index = 0; index < this.ctrl.data.thresholds.length; index++) {
              var thresh = (this.ctrl.data.thresholds[index] - minGrad) / (maxGrad - minGrad);
              if (thresh > 1) thresh = 1;else if (thresh < 0) thresh = 0;
              gradientData[thresh] = this.rgb2hex(this.ctrl.panel.colors[index + 1]);
            }
            var radius = parseInt(this.ctrl.panel.heatSize),
                blur = parseInt(this.ctrl.panel.heatBlur);
            var heatOpts = { radius: radius, blur: blur, max: mapMaxVal, gradient: gradientData };
            this.heatLayer = window.L.heatLayer(heatData, heatOpts).addTo(this.map);
            this.heatData = heatData;
          }
        }, {
          key: 'resize',
          value: function resize() {
            this.map.invalidateSize();
          }
        }, {
          key: 'panToMapCenter',
          value: function panToMapCenter() {
            this.map.panTo([parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude)]);
            this.ctrl.mapCenterMoved = false;
          }
        }, {
          key: 'removeLegend',
          value: function removeLegend() {
            this.legend.removeFrom(this.map);
            this.legend = null;
          }
        }, {
          key: 'addCircles',
          value: function addCircles(circles) {
            return window.L.layerGroup(circles).addTo(this.map);
          }
        }, {
          key: 'removeCircles',
          value: function removeCircles() {
            this.map.removeLayer(this.circlesLayer);
          }
        }, {
          key: 'setZoom',
          value: function setZoom(zoomFactor) {
            this.map.setZoom(parseInt(zoomFactor, 10));
          }
        }, {
          key: 'remove',
          value: function remove() {
            this.circles = {};
            if (this.circlesLayer) this.removeCircles();
            if (this.legend) this.removeLegend();
            this.map.remove();
          }
        }]);

        return WorldMap;
      }();

      _export('default', WorldMap);
    }
  };
});
//# sourceMappingURL=worldmap.js.map
