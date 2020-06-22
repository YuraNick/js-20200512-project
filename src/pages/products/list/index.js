import SortableTable from '../../../components/sortable-table/index.js';
import header from './products-header.js';

import fetchJson from '../../../utils/fetch-json.js';

export default class Page {
  element;
  subElements = {};
  components = {};

  // async getDataForColumnCharts (from, to) {
  //   const ORDERS = `${process.env.BACKEND_URL}api/dashboard/orders?from=${from.toISOString()}&to=${to.toISOString()}`;
  //   const SALES = `${process.env.BACKEND_URL}api/dashboard/sales?from=${from.toISOString()}&to=${to.toISOString()}`;
  //   const CUSTOMERS = `${process.env.BACKEND_URL}api/dashboard/customers?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;

  //   const ordersData = fetchJson(ORDERS);
  //   const salesData = fetchJson(SALES);
  //   const customersData = fetchJson(CUSTOMERS);

  //   const data = await Promise.all([ordersData, salesData, customersData]);
  //   return data.map(item => Object.values(item));
  // }

  async updateTableComponent (from, to) {
    const data = await fetchJson(`${process.env.BACKEND_URL}api/dashboard/bestsellers?_start=1&_end=20&from=${from.toISOString()}&to=${to.toISOString()}`);
    this.components.sortableTable.addRows(data);
  }

  async updateChartsComponents (from, to) {
    const [ordersData, salesData, customersData] = await this.getDataForColumnCharts(from, to);
    const ordersDataTotal = ordersData.reduce((accum, item) => accum + item);
    const salesDataTotal = salesData.reduce((accum, item) => accum + item);
    const customersDataTotal = customersData.reduce((accum, item) => accum + item);

    this.components.ordersChart.update({headerData: ordersDataTotal, bodyData: ordersData});
    this.components.salesChart.update({headerData: '$' + salesDataTotal, bodyData: salesData});
    this.components.customersChart.update({headerData: customersDataTotal, bodyData: customersData});
  }

  async initComponents () {

    const sortableTable = new SortableTable(header, {
      // url: `api/rest/products?_embed=subcategory.category&_order=title&_sort=asc&_start=0&_end=20`,
      url: `api/rest/products`,
      isSortLocally: false,
      start : 0,
      step : 20,
      embed : 'subcategory.category',
      rowHrefTemplate : (data) => `/products/${data?.id}`
    });

    this.components.sortableTable = sortableTable;
  }

  get template () {
    return `<div class="products-list">
      <div class="content__top-panel">
        <h2 class="page-title">Товары</h2>
        <a href="/products/add" class="button-primary">Добавить товар</a>
      </div>
      <div data-element="productsContainer" class="products-list__container">
        <div data-element="sortableTable">
          <!-- sortable-table component -->
        </div>
      </div>
    </div>`;
  }

  async render () {
    const element = document.createElement('div');

    element.innerHTML = this.template;

    this.element = element.firstElementChild;
    this.subElements = this.getSubElements(this.element);

    await this.initComponents();

    this.renderComponents();
    this.initEventListeners();

    return this.element;
  }

  renderComponents () {
    Object.keys(this.components).forEach(component => {
      const root = this.subElements[component];
      const { element } = this.components[component];

      root.append(element);
    });
  }

  getSubElements ($element) {
    const elements = $element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  initEventListeners () {
    // this.components.rangePicker.element.addEventListener('date-select', event => {
    //   const { from, to } = event.detail;
    //   this.updateChartsComponents(from, to);
    //   this.updateTableComponent(from, to);
    // });
  }

  destroy () {
    for (const component of Object.values(this.components)) {
      component.destroy();
    }
  }
}
