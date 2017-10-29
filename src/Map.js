import React, { Component } from 'react';
import $ from 'jquery';
import './Map.css';
import { Map, TileLayer, GeoJSON, LayersControl } from 'react-leaflet';
import { ckmeans } from 'simple-statistics';
import Control from 'react-leaflet-control';

const { BaseLayer } = LayersControl

export default class MapComponent extends Component {

  /**
   * Constructor initializes the module.
   *
   * @param props the properties
   */
  constructor(props) {
    super(props);

    // the shading colors for census tracts
    this.shadingColors = ['#eff3ff','#bdd7e7','#6baed6','#3182bd','#08519c'];

    // the shading color for parks and greenways
    this.greenspaceColor = "#006d2c";

    // the component state, including the geojson, ranges, and legend attributes
    this.state = {
      greenwaysGeoJson: null,
      parksGeoJson: null,
      povertyGeoJson: null,
      incomeGeoJson: null,
      housingGeoJson: null,
      povertyRanges: null,
      incomeRanges: null,
      housingRanges: null,
      legendRanges: [],
      legendTitle: ""
    };

    // bind 'this' to the functions
    this.greenspaceStyle = this.greenspaceStyle.bind(this);
    this.styleFeature = this.styleFeature.bind(this);
    this.formatRanges = this.formatRanges.bind(this);
    this.bindTooltip = this.bindTooltip.bind(this);
    this.addProperties = this.addProperties.bind(this);
    this.handleBaseLayerChange = this.handleBaseLayerChange.bind(this);
  }

  /**
   * Before the component mounts, retrieve the geojson and set the state.
   */
  componentWillMount() {
    const self = this;
    const greenwaysRequest = $.ajax({
      type: "GET",
      url: "https://opendata.arcgis.com/datasets/79ecc55fc064472c897f09e28dea473c_0.geojson"
    });
    const parksRequest = $.ajax({
      type: "GET",
      url: "https://opendata.arcgis.com/datasets/127fd263dfc64a73a2c2815c9d65b1d5_0.geojson"
    });
    const povertyRequest = $.ajax({
      type: "GET",
      url: "https://opendata.arcgis.com/datasets/909709016b6d41708d0fad23f8355aa1_0.geojson"
    });
    const incomeRequest = $.ajax({
      type: "GET",
      url: "https://opendata.arcgis.com/datasets/43237025f97e41f3bed70dd2203f8317_0.geojson"
    });
    const housingRequest = $.ajax({
      type: "GET",
      url: "https://opendata.arcgis.com/datasets/77adfcaf3d4d4361b8b6c4a57f0254b9_0.geojson"
    });

    $.when(greenwaysRequest, parksRequest, povertyRequest, incomeRequest, housingRequest).done(function(greenwaysResponse, parksResponse, povertyResponse, incomeResponse, housingResponse) {
      const povertyRanges = self.generateRanges(povertyResponse[0].features, "percent_be");
      const incomeRanges = self.generateRanges(incomeResponse[0].features, "median_inc");
      const housingRanges = self.generateRanges(housingResponse[0].features, "median_mon");
      self.addProperties(povertyResponse[0].features, povertyRanges, "percent_be", "percent");
      self.addProperties(incomeResponse[0].features, incomeRanges, "median_inc", "currency");
      self.addProperties(housingResponse[0].features, housingRanges, "median_mon", "currency");

      self.setState({
        greenwaysGeoJson: greenwaysResponse[0],
        parksGeoJson: parksResponse[0],
        povertyGeoJson: povertyResponse[0],
        incomeGeoJson: incomeResponse[0],
        housingGeoJson: housingResponse[0],
        povertyRanges: povertyRanges,
        incomeRanges: incomeRanges,
        housingRanges: housingRanges,
        legendRanges: self.formatRanges(housingRanges, "currency"),
        legendTitle: "Median Monthly Housing Cost"
      });
    });
  };

  /**
   * Generates ranges for an array of features.
   *
   * @param features the features
   * @param propertyName the name of the property to read from the features
   * @return the ranges
   */
  generateRanges = function(features, propertyName) {
    const self = this;
    const values = [];
    features.forEach(function(feature) {
      values.push(feature.properties[propertyName]);
    });
    const ranges = ckmeans(values, 5);
    const newShadingRanges = [];
    ranges.forEach(function(range, index) {
      newShadingRanges.push({
        min: range[0],
        max: range[range.length - 1],
        color: self.shadingColors[index]
      });
    });

    return newShadingRanges;
  }

  /**
   * Adds the following properties to each feature:
   * - color: the color to shade the feature
   * - tooltipValue: the feature tooltip text
   * - ranges: the feature shading ranges, formatted for display in the legend
   *
   * @param features the features
   * @param ranges the ranges
   * @param propertyName the name of the property to read from the features
   * @param format the feature property value format. valid values are "percent" and "currency"
   */
  addProperties(features, ranges, propertyName, format) {
    const self = this;
    features.forEach(function(feature) {
      let color = "#000";
      for (var i = 0; i < ranges.length; i++) {
        if (feature.properties[propertyName] >= ranges[i].min && feature.properties[propertyName] <= ranges[i].max) {
          color = self.shadingColors[i];
          break;
        }
      }
      feature.properties.color = color;

      feature.properties.tooltipValue = self.formatNumber(feature.properties[propertyName], format);

      const formattedRanges = [];
      ranges.forEach(function(range) {
        const formattedRange = Object.assign({}, range);
        formattedRange.min = self.formatNumber(formattedRange.min, format);
        formattedRange.max = self.formatNumber(formattedRange.max, format);
        formattedRanges.push(formattedRange);
      });


      feature.properties.ranges = self.formatRanges(ranges, format);
    });
  };

  /**
   * Formats ranges.
   *
   * @param rangse the ranges
   * @param format the feature property value format. valid values are "percent" and "currency"
   * @return the formatted ranges
   */
  formatRanges(ranges, format) {
    const self = this;
    const formattedRanges = [];
    ranges.forEach(function(range) {
      const formattedRange = Object.assign({}, range);
      formattedRange.min = self.formatNumber(formattedRange.min, format);
      formattedRange.max = self.formatNumber(formattedRange.max, format);
      formattedRanges.push(formattedRange);
    });

    return formattedRanges;
  }

  /**
   * Formats a number.
   *
   * @param number the number
   * @param format the feature property value format. valid values are "percent" and "currency"
   * @return the formatted number
   */
  formatNumber(number, format) {
    let formattedNumber = null;
    switch (format) {
      case "percent":
        formattedNumber = Math.round(number * 100) + "%";
        break;
      case "currency":
        formattedNumber = "$" + number.toLocaleString();
        break;
      default:
        formattedNumber = number;
    }

    return formattedNumber;
  }

  /**
   * @return the greenspace style
   */
  greenspaceStyle = function() {
    return {
      color: this.greenspaceColor,
      fillOpacity: 1,
      weight: 2
    }
  };

  /**
   * @return the feature style
   */
  styleFeature = function(feature, ranges) {
    return  {
      color: "#333",
      fillColor:feature.properties.color,
      fillOpacity: 0.5,
      weight: 1
    }
  };

  /**
   * Binds a tooltip to a feature.
   */
  bindTooltip = function(feature, layer) {
    const tooltip = "<h4>" + feature.properties.namelsad + ": " + feature.properties.tooltipValue + "</h4>";
    layer.bindTooltip(tooltip);
  };

  /**
   * Handles a base layer change by updating the legend.
   */
  handleBaseLayerChange = function(event) {
    this.setState({
      legendRanges: event.layer.toGeoJSON().features[0].properties.ranges,
      legendTitle: event.name
    });
  };

  /**
   * Renders the component.
   */
  render() {
    const position = [35.56, -82.5515];
    const zoom = 11;
    const greenways = this.state.greenwaysGeoJson ? <GeoJSON data={this.state.greenwaysGeoJson} style={this.greenspaceStyle} /> : null;
    const parks = this.state.parksGeoJson ? <GeoJSON data={this.state.parksGeoJson} style={this.greenspaceStyle} /> : null;
    const povertyLayer = this.state.povertyGeoJson
      ? <BaseLayer name="Percent Below Poverty">
          <GeoJSON data={this.state.povertyGeoJson} style={this.styleFeature} onEachFeature={this.bindTooltip} />
        </BaseLayer>
      : null;
    const incomeLayer = this.state.incomeGeoJson
      ? <BaseLayer name="Median Household Income">
          <GeoJSON data={this.state.incomeGeoJson} style={this.styleFeature} onEachFeature={this.bindTooltip} />
        </BaseLayer>
      : null;
    const housingLayer = this.state.housingGeoJson
      ? <BaseLayer checked name="Median Monthly Housing Cost" id="housingLayer">
          <GeoJSON data={this.state.housingGeoJson} style={this.styleFeature} onEachFeature={this.bindTooltip} />
        </BaseLayer>
      : null;
    const legendItems = this.state.legendRanges.map((range, index) => <li key={index}><span className="legend-range-icon" style={{backgroundColor: range.color}}></span> {range.min} - {range.max}</li>);

    return (
      <Map center={position} zoom={zoom} onBaselayerchange={this.handleBaseLayerChange}>
        <TileLayer
          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
          attribution="&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>, &copy;<a href='https://carto.com/attribution'>CARTO</a>"
        />
        {greenways}
        {parks}
        <LayersControl position="topright" oonCh>
          {housingLayer}
          {incomeLayer}
          {povertyLayer}
        </LayersControl>
        <Control position="bottomright" className="legend-control">
          <div>
            <h3>{this.state.legendTitle}</h3>
            <ul className="legend-range-list">
              <li><span className="legend-range-icon" style={{backgroundColor: this.greenspaceColor}}></span> Parks &amp; Greenways</li>
              {legendItems}
            </ul>
          </div>
        </Control>
      </Map>
    );
  }
}
