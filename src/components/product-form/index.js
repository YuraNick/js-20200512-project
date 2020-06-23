import fetchJson from '../../utils/fetch-json.js';
import ImageUploader from './image-uploader.js';
import NotificationMessage from '../notification/index.js';
import SortableList from '../sortable-list/index.js';

const BACKEND_URL = 'https://course-js.javascript.ru';
const BACKEND_SEND_URL = 'https://course-js.javascript.ru';
const PRODUCTS_API = 'api/rest/products';
const CATEGIRIES_API = 'api/rest/categories?_sort=weight&_refs=subcategory';

export default class ProductForm {
    element;
    subElements;
    subCategory = [];
    productData = {};
    sortableList;

    uploadImageShowEvent = () => {
        this.subElements.inputFile.click();
    }

    uploadImageChangeEvent = (event) => {
        const file = event.target.files[0];
        
        if (file) {
            this.uploadImage(file);
        }
    }

    submitEvent = (event) => {
        event.preventDefault();
        
        this.sendForm();
    }

    constructor (productId) {
        this.productId = productId;
    }

    async sendForm() {
        const formData = new FormData(this.subElements.productForm);
        const url = new URL(PRODUCTS_API, BACKEND_SEND_URL);

        const data = {
            method: 'PATCH',
            body: formData,
            headers : {
                authority: 'course-js.javascript.ru'
            }
        }

        let notification;

        try {
            const response = await fetchJson(url, data);

            if (response) {
                notification = new NotificationMessage('Товар сохранен', {type : 'success'});
            } else {
                notification = new NotificationMessage('Неизвестная ошибка!', {type : 'error'});
            }

        } catch(error) {
            notification = new NotificationMessage(`${error.message}`, {type : 'error'});
        }

        notification.show(this.subElements.productForm);
    }

    async loadCategories() {
        const url = new URL(CATEGIRIES_API, BACKEND_URL);
        const categoriesResponse = await fetchJson(url);

        if (categoriesResponse && categoriesResponse.length) {
            this.getCategories(categoriesResponse);
        }
    }

    async loadProduct(productId) {
        if (! productId) {
            return;
        }

        const url = new URL(PRODUCTS_API, BACKEND_URL);

        url.searchParams.set('id', productId);

        const productResponse = await fetchJson(url);

        if (productResponse && productResponse.length) {
            this.productData = productResponse[0];
        }
    }

    async loadData(productId) {
        await Promise.all([
            this.loadCategories(),
            this.loadProduct(productId),
        ]);
    }

    async uploadImage (file) {
        const { uploadImage, imageList } = this.subElements;
        uploadImage.classList.add("is-loading"),
        uploadImage.disabled = true;

        const imageUploader = new ImageUploader();

        try {
            const response = await imageUploader.upload(file);

            const data = response.data;

            if (response.success && data) {
                const url = data.link || '';
                const source = file.name;

                const imageElement = document.createElement('li');
                imageElement.innerHTML = this.imageTemplate({url, source});

                imageList.append(imageElement);
            }
        } catch(error) {
            const notification = new NotificationMessage(error.message, {type : 'error'});
            
            notification.show(this.element.productForm);
        } 

        uploadImage.classList.remove("is-loading"),
        uploadImage.disabled = false;
    }

    getCategories (categories) {
        const subCategory = [];

        categories.forEach( category => {
            const { title : categoryTitle, subcategories } = category;
            
            this.addSubCategories(subCategory, {categoryTitle, subcategories});
        });

        this.subCategory = subCategory;
    }

    addSubCategories (accum, { categoryTitle = '', subcategories = [] } = {}) {
        subcategories.forEach( subCategory => {
            const { id : subCategoryTitleId, title : subCategoryTitle } = subCategory;
            
            accum.push({ subCategoryTitleId, categoryTitle, subCategoryTitle });
        });

        return accum;
    }

    addImagesListItems() {
        const items = this.getImageElementsArray();
        const { imageList : element } = this.subElements

        this.sortableList = new SortableList({ element, items });
    }

    async render () {
        await this.loadData(this.productId);
        
        const wrapper = document.createElement('div');
        wrapper.innerHTML = this.template();

        const element = wrapper.firstElementChild;
        
        this.subElements = this.getSubElements(element);

        this.addImagesListItems();
        
        this.addSubCategoryOptions();
        
        this.element = element;

        this.initEventListeners();

        return this.element;
    }

    getImageElementsArray() {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = this.getImagesListTemplate();

        return [...wrapper.children];
    }

    initEventListeners() {
        const { uploadImage, inputFile } = this.subElements;
        
        uploadImage.addEventListener('click', this.uploadImageShowEvent);
        inputFile.addEventListener('change', this.uploadImageChangeEvent);
        this.subElements.productForm.addEventListener('submit', this.submitEvent);
    }

    removeEventListeners() {
        const { uploadImage, inputFile } = this.subElements;
        
        uploadImage.removeEventListener('click', this.uploadImageShowEvent);
        inputFile.removeEventListener('change', this.uploadImageChangeEvent);
        this.subElements.productForm.removeEventListener('submit', this.submitEvent);
    }

    addSubCategoryOptions() {
        const { subcategory } = this.subElements.productForm.elements;
        const { subcategory : productSubCategory } = this.productData;
        
        for (const subCategory of this.subCategory) {
            const selected = Boolean(productSubCategory === subCategory.subCategoryTitleId);
            const option = this.createCategiryOption(selected, subCategory);

            subcategory.append(option);
        }
    }

    createCategiryOption(selected, { subCategoryTitleId = '', categoryTitle = '', subCategoryTitle = '' } = {}) {
        const text = `${categoryTitle} > ${subCategoryTitle}`;

        return new Option(text, subCategoryTitleId, selected, selected);
    }

    categoriesTemplate(subCategory) {
        return subCategory.map(subCategoryItem => this.categoryTemplate(subCategoryItem)).join('');
    }

    categoryTemplate ({ subCategoryTitleId, categoryTitle, subCategoryTitle }) {
        return `<option value="${subCategoryTitleId}">${categoryTitle} &gt; ${subCategoryTitle}</option>`;
    }

    imageTemplate ({ url = '', source = '' } = {}) {
        return `
        <li class="products-edit__imagelist-item sortable-list__item" style="">
          <input type="hidden" name="url" value="${url}">
          <input type="hidden" name="source" value="${source}">
          <span>
            <img src="icon-grab.svg" data-grab-handle alt="grab">
            <img class="sortable-table__cell-img" alt="Image" src="${url}">
            <span>${source}</span>
          </span>
          <button type="button">
            <img src="icon-trash.svg" data-delete-handle alt="delete">
          </button>
        </li>
        `;
    }

    inputFileTemplate () {
        return `
            <input type="file" data-element="inputFile" accept="image/*" hidden>
        `;
    }

    nameDescriptionTemplate () {
        const { title = '', description = '' } = this.productData;

        return `
            <div class="form-group form-group__half_left">
                <fieldset>
                  <label class="form-label">Название товара</label>
                  <input required="" value="${title}" type="text" name="title" class="form-control" placeholder="Название товара">
                </fieldset>
            </div>
            <div class="form-group form-group__wide">
                <label class="form-label">Описание</label>
                <textarea required="" class="form-control" name="description" data-element="productDescription" placeholder="Описание товара">${description}</textarea>
            </div>
        `;
    }

    getImagesListTemplate() {
        const { images } = this.productData;

        if (! images || ! images.length) {
            return '';
        }

        return images.map(image => this.imageTemplate(image)).join('');
    }

    imagesTemplate() {
        return `
        <div class="form-group form-group__wide" data-element="sortable-list-container">
            <label class="form-label">Фото</label>
            
            <div data-element="imageListContainer">
                <ul data-element="imageList"></ul>
            </div>
            
            <button type="button" data-element="uploadImage" name="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
        </div>
        `;
    }

    template () {
        return `
        <div class="product-form">
            <form data-element="productForm" class="form-grid">
                ${this.nameDescriptionTemplate()}
                ${this.imagesTemplate()}
                ${this.propertyTemplate()}
                ${this.submitTemplate()}
            </form>
            ${this.inputFileTemplate()}
        </div>    
        `;
    }

    propertyTemplate() {
        const { status = '', price = '', quantity = '', discount = ''} = this.productData;
        
        const activeSelected = (status === 1) ? 'selected' : '';
        const notActiveSelected = (status === 0) ? 'selected' : '';

        return `
        <div class="form-group form-group__half_left">
            <label class="form-label">Категория</label>
            <select class="form-control" name="subcategory"></select>
        </div>

        <div class="form-group form-group__half_left form-group__two-col">
            <fieldset>
              <label class="form-label">Цена ($)</label>
              <input required="" value="${price}" type="number" name="price" class="form-control" placeholder="100">
            </fieldset>
            <fieldset>
              <label class="form-label">Скидка ($)</label>
              <input required="" value="${discount}" type="number" name="discount" class="form-control" placeholder="0">
            </fieldset>
        </div>

        <div class="form-group form-group__part-half">
            <label class="form-label">Количество</label>
            <input required="" value="${quantity}" type="number" class="form-control" name="quantity" placeholder="1">
        </div>

        <div class="form-group form-group__part-half">
            <label class="form-label">Статус</label>
            <select class="form-control" name="status">
              <option value="1" ${activeSelected}>Активен</option>
              <option value="0" ${notActiveSelected}>Неактивен</option>
            </select>
        </div>
        `;
    }

    submitTemplate() {
        const submitText = (this.productData) ? 'Сохранить товар' : 'Добавить товар';

        return `
        <div class="form-buttons">
          <button type="submit" name="save" class="button-primary-outline">
            ${submitText}
          </button>
        </div>
        `; 
    }

    getSubElements (element) {
        const elements = element.querySelectorAll('[data-element]');
    
        return [...elements].reduce((accum, subElement) => {
          accum[subElement.dataset.element] = subElement;
    
          return accum;
        }, {});
    }

    remove() {
        this.sortableList.destroy();
        this.removeEventListeners();
        this.element.remove();
    }

    destroy() {
        this.remove();
    }

}
