function isCharsIncludedInOrder(query, text) {
    let queryPos = 0;
    let textPos = 0;
    while (queryPos < query.length && textPos < text.length) {
        if (query.charAt(queryPos) == text.charAt(textPos)) {
            ++queryPos;
            ++textPos;
        }
        else {
            ++textPos;
        }
    }
    return queryPos == query.length;
}

class LangLink {
    constructor(window, document) {
        this.window = window;
        this.element = document.getElementsByClassName('lang')[0];
    }

    click() {
        this.window.location.href = this.element.href;
    }
}

class Search {
    prepareQuery(query) {
        return query.toLowerCase().trim();
    }

    isExactMatch(query, name) {
        return name === query;
    }

    isFuzzySearchMatch(query, name) {
        return isCharsIncludedInOrder(query, name);
    }
}

class Links {
    constructor(document, state) {
        let self = this;
        this.search = new Search();
        this.highlightedLinkStyle = 'link-highlighted'
        this.links = Array.from(document.getElementsByTagName('a'))
            .filter(link => link.classList.length == 0)
            .map(link => {
                return {
                    name: link.textContent,
                    element: link
                };
            });
        state.subscribe(state => {
            self.reset();
            self.filterByQuery(state.query);
        });
    }

    filterByQuery(rawQuery) {
        let query = this.search.prepareQuery(rawQuery);
        if (query.length === 0) {
            return;
        }
        let self = this;

        let predicates = [
            (query, name) => this.search.isExactMatch(query, name),
            (query, name) => this.search.isFuzzySearchMatch(query, name),
        ]

        for (var i = 0; i < predicates.length; ++i) {
            let predicate = predicates[i];
            let selected = this.links.filter(item => {
                let name = item.name;
                return predicate(query, name);
            });
            if (selected.length > 0) {
                selected.forEach(item => {
                    item.element.classList.add(self.highlightedLinkStyle);
                });
                return;
            }       
            
        }
    }

    reset() {
        let self = this;
        this.links
            .forEach(link => {
                link.element.classList.remove(self.highlightedLinkStyle);
            });
    }

    getSelected() {
        let self = this;
        return this.links.filter(item => {
            let el = item.element;
            return el.classList.contains(self.highlightedLinkStyle);
        });
    }
}

class State {
    constructor() {
        this.searchQuery = '';
        this.subscribers = [];
    }

    subscribe(listener) {
        this.subscribers.push(listener);
    }

    fireUpdateEvent() {
        let self = this;
        this.subscribers.forEach(subscriber => subscriber({
            query: self.searchQuery
        }));
    }
    
    setQuery(value) {
        this.searchQuery = value;
        this.fireUpdateEvent();
        return this;
    }

    getQuery() {
        return this.searchQuery;
    }
}

class QueryInput {
    constructor(document, state, links) {
        let self = this;
        this.document = document;
        this.element = document.getElementsByClassName('query')[0];
        
        this.element.addEventListener('input', (event) => {
            state.setQuery(self.element.value);
        });

        state.subscribe(state => {
            if (links.getSelected().length === 1) {
                self.element.classList.add('query-highlighted');
            }
            else {
                self.element.classList.remove('query-highlighted');
            }
        });
    }

    reset() {
        this.element.value = '';
        this.element.classList.remove('query-highlighted');
    }

    focus() {
        this.element.focus();
    }

    hasFocus() {
        return this.document.activeElement === this.element;
    }
}

class KeyboardHandler {
    constructor(window, langLink, links, queryInput) {
        window.addEventListener("keydown", (event) => {
            if (window.location.href.includes("debug")) {
                console.log(event.key);
            }          
            if (event.ctrlKey && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
                langLink.click();
                return;
            }
            if (event.key === 'Escape') {
                links.reset();
                queryInput.reset();
                event.preventDefault();
                return;
            }
            if (event.key === 'Enter') {
                let selected = links.getSelected();
                if (selected.length === 1) {
                    window.open(selected[0].element.href, "_blank");
                }
                return;                
            }
            if (this.__specialKeyPressed(event)) {
                return;
            }
            if (!queryInput.hasFocus()) {
                queryInput.focus();
                return;
            }
        });
    }

    __specialKeyPressed(event) {
        return event.key === 'Tab' || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey;
    }
}

function initPage() {
    window.addEventListener('load', () => {
        let state = new State();
        let langLink = new LangLink(window, document);
        let links = new Links(document, state);
        let queryInput = new QueryInput(document, state, links);
        queryInput.focus();

        let keyboardHandler = new KeyboardHandler(window, langLink, links, queryInput);              
    });
}

initPage();
