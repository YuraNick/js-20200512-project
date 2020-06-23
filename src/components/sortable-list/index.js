const LIST_CLASS = 'sortable-list';
const ITEM_CLASS = 'sortable-list__item';
const DRAG_CLASS = 'sortable-list__item_dragging';
const PLACEHOLDER_CLASS = 'sortable-list__placeholder';

export default class SortableList {
    element;
    dragElement;
    dragOffset = {};
    placeholder;
    placeholderProperty = {};
    

    sortableListEvent = (event) => {
        const element = event.target;

        const listElement = element.closest('.sortable-list__item');

        if (element.closest('[data-delete-handle]')) {
            listElement.remove();
        } 

    }

    dragStart = (event) => {
        const element = event.target;
        const dragElement = element.closest('.sortable-list__item');
        
        const itemIndex = [...this.items].findIndex(item => item === dragElement);

        if (
            element.closest('[data-delete-handle]') ||
            ! element.closest('[data-grab-handle]') ||
            ! dragElement
        ) {
            return;
        }

        const { width, height, left, top } = dragElement.getBoundingClientRect();
        const placeholder = dragElement.cloneNode(false);

        this.dragOffset.x = event.clientX - left;
        this.dragOffset.y = event.clientY - top;
        
        this.setElementSize(dragElement, { width, height });
        this.setElementPosition(dragElement, { left, top });
        
        this.placeholderProperty = { top, left, width, height, itemIndex };

        placeholder.classList.add(PLACEHOLDER_CLASS);
        this.setElementSize(placeholder, { width, height });
        
        dragElement.replaceWith(placeholder);

        dragElement.classList.add(DRAG_CLASS);

        this.element.append(dragElement);

        this.dragElement = dragElement;
        this.placeholder = placeholder;

        document.addEventListener('mousemove', this.dragMove);
        document.addEventListener('mouseup', this.dragEnd, { once : true });
    }

    dragMove = (event) => {
        event.preventDefault();

        const dragElement = this.dragElement;
        
        const { x : offsetX, y : offsetY } = this.dragOffset;
        const { clientX, clientY } = event;

        const top = clientY - offsetY;
        const left = clientX - offsetX;

        this.setElementPosition(dragElement, { top, left });

        const { height, itemIndex, top : placeholderTop } = this.placeholderProperty;

        const placeholderBottom = placeholderTop + height;
        const dragBottom = top + height;
        
        const overCondition = Boolean(dragBottom < placeholderTop && itemIndex);
        const belowCondition = Boolean(top > placeholderBottom);

        if (! overCondition && ! belowCondition) {
            return;
        }

        const middleTop = top + height / 2;
        
        const newItemFind = this.findItem(overCondition, { middleTop, itemIndex });

        if (newItemFind.item) {
            const { item : newItem, i : newItemIndex, top : newTop } = newItemFind;
            const method = (overCondition) ? 'before' : 'after';
            
            newItem[method](this.placeholder);
            this.placeholderProperty.itemIndex = newItemIndex;
            this.placeholderProperty.top = newTop;
        }

    }

    findItem (isRevers, { middleTop, itemIndex }) {
        const items = [...this.items];
        let found = false;

        if (isRevers) {
            
            for (let i = itemIndex - 1; i > -1; i--) {
                found = condition(i);
                
                if ( found ) {
                    break;
                }
            }

        } else {
            
            for (let i = itemIndex + 1; i < items.length; i++) {
                found = condition(i);
                
                if ( found ) {
                    break;
                }
            }

        }

        return found;

        function condition (i) {
            const item = items[i];
            const { top, bottom } = item.getBoundingClientRect();
            
            if (middleTop > top && middleTop < bottom) {
                return {item, top, bottom, i};
            }
            
            return false;
        }
    }

    dragEnd = (event) => {
        document.removeEventListener('mousemove', this.dragMove);

        const placeholder = this.placeholder;
        const dragElement = this.dragElement;

        dragElement.remove();
        dragElement.classList.remove(DRAG_CLASS);

        this.clearElementSizeAndPosition(dragElement);

        placeholder.replaceWith(dragElement);

        this.placeholder = null;
    }


    constructor( { element = null, items = [] } = {} ) {
        this.element = element;
        this.render(element, items);

    }

    render(element, items) {
        element = element || document.createElement('ul');

        items.forEach(item => {
            item.classList.add(ITEM_CLASS);
        });
        
        element.classList.add(LIST_CLASS);

        element.append(...items);

        this.items = element.getElementsByClassName(ITEM_CLASS);

        this.element = element;

        this.initEventListeners();
    }

    initEventListeners() {
        this.element.addEventListener('mousedown', this.dragStart);
        this.element.addEventListener('click', this.sortableListEvent);
    }

    removeEventListeners() {
        this.element.removeEventListener('mousedown', this.dragStart);
        this.element.removeEventListener('click', this.sortableListEvent);
    }

    setElementSize (element, {width, height}) {
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;
    }

    setElementPosition (element, {top, left}) {
        element.style.top = `${top}px`;
        element.style.left = `${left}px`;
    }

    clearElementSizeAndPosition(element) {
        element.style.width = '';
        element.style.height = '';
        element.style.top = '';
        element.style.left = '';
    }

    remove () {
        this.element.remove();
    }

    destroy() {
        this.remove();
    }

   
}
