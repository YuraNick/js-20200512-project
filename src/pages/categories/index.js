import fetchJson from '../../utils/fetch-json.js';
import Notification from '../../components/notification/index.js';
import SortableList from '../../components/sortable-list/index.js';

export default class Page {
    element;
    subelements;
    sortableLists = [];
    // categoriesContainer

    async render () {
        const data = await this.getData();

        const element = this.crateElementFromHtml(this.elementTemplate);
        const subElements = this.getSubElements(element);

        const { categoriesContainer } = subElements;

        this.renderCategories(categoriesContainer, data);

        this.element = element;
        this.subElements = subElements;

        return element;
    }

    get elementTemplate() {
        return `
        <div class="categories">
          <div class="content__top-panel">
            <h1 class="page-title">Категории товаров</h1>
          </div>

          <div data-element="categoriesContainer"></div>
        </div>
        `;
    }

    renderCategories (element, data) {
        const categories = data.map(categoryData => this.renderCategory(categoryData));

        element.append(...categories);
    }

    renderCategory (categoryData) {
        const { subcategories = [] } = categoryData;

        const categoryHTML = this.categoryTemplate(categoryData);
        const categoryElement = this.crateElementFromHtml(categoryHTML);

        const subcategoryList = categoryElement.querySelector('.subcategory-list');

        const subcategirySortableList = this.getSortableList(subcategories);

        subcategoryList.append(subcategirySortableList);

        return categoryElement;

    }

    async getData() {
        const CATEGORIES = `${process.env.BACKEND_URL}api/rest/categories?_sort=weight&_refs=subcategory`;
        const data = await fetchJson(CATEGORIES);

        return data;
    }

    getSortableList (subcategories) {
        const items = subcategories.map(subcategory => {
            const categoryHTML = this.sortableListItemTemplate(subcategory);

            return this.crateElementFromHtml(categoryHTML);
        });

        const sortableList = new SortableList({ items });
        
        this.sortableLists.push(sortableList);

        return sortableList.element;
    }

    crateElementFromHtml (innerHTML) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = innerHTML;

        return wrapper.firstElementChild;
    }

    categoryTemplate(categoryData) {
        const { id = '', title = '' } = categoryData;

        return `
        <div class="category category_open" data-id="${id}">
          <header class="category__header">
            ${title}
          </header>
          <div class="category__body">
            <div class="subcategory-list">
            </div>
          </div>
        </div>
        `;
    }

    sortableListItemTemplate (subcategory) {
        const { id =' ', count = 0, title = '' } = subcategory;

        return `
        <li class="categories__sortable-list-item sortable-list__item" data-grab-handle="" data-id="${id}">
          <strong>${title}</strong>
          <span><b>${count}</b> products</span>
        </li>
        `;
    }

    getSubElements (element) {
        const elements = element.querySelectorAll('[data-element]');
    
        return [...elements].reduce((accum, subElement) => {
          accum[subElement.dataset.element] = subElement;
    
          return accum;
        }, {});
    }

    destroy() {
        this.sortableLists.forEach(sortableList => {
            sortableList.destroy();
        });

        this.element.remove();
    }
}