const QUERY_DEBOUNCE_DELAY_MS = 150;

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

function debounce(callback, delay) {
    let timeout = null;

    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback(...args), delay);
    };
}

class LangLink {
    constructor(window, document, state) {
        let self = this;
        this.window = window;
        this.element = document.getElementsByClassName('lang')[0];
        state.subscribe(s => self.__update(s));
    }

    click() {
        this.window.location.href = this.element.href;
    }

    __update(state) {
        let serializedState = state.serialize();
        let href = this.element.attributes.getNamedItem("href");
        let index = href.value.indexOf("#");
        href.value = index < 0
            ? href.value + "#" + serializedState
            : href.value.substring(0, index) + "#" + serializedState;

        this.element.attributes.setNamedItem(href);
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
            self.filterByQuery(state.getQuery());
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
        this.subscribers.forEach(subscriber => subscriber(self));
    }

    setQuery(value) {
        this.searchQuery = value;
        this.fireUpdateEvent();
        return this;
    }

    getQuery() {
        return this.searchQuery;
    }

    serialize() {
        return 'query=' + this.getQuery().replace(/ /g, '_');
    }

    __deserialize(value) {
        let self = this;
        let tokens = value.split('&');
        tokens.forEach(token => {
            let data = token.split('=');
            let paramName = data[0];
            let paramValue = data[1];
            if (paramName === 'query') {
                self.searchQuery = paramValue.replace(/_/g, ' ');
            }
        });
    }

    read(value) {
        this.__deserialize(value);
        this.fireUpdateEvent();
        return this;
    }
}

class QueryInput {
    constructor(document, state, links) {
        let self = this;
        this.document = document;
        this.element = document.getElementsByClassName('query')[0];

        this.setQuery = debounce((value) => {
            state.setQuery(value);
        }, QUERY_DEBOUNCE_DELAY_MS);

        this.element.addEventListener('input', () => {
            self.setQuery(self.element.value);
        });

        state.subscribe(state => {
            self.setValue(state.getQuery());
            if (links.getSelected().length === 1) {
                self.element.classList.add('query-highlighted');
            }
            else {
                self.element.classList.remove('query-highlighted');
            }
        });
    }

    reset() {
        this.setValue('');
        this.element.classList.remove('query-highlighted');
    }

    setValue(value) {
        this.element.value = value;
    }

    focus() {
        this.element.focus();
    }

    hasFocus() {
        return this.document.activeElement === this.element;
    }
}

class KeyboardHandler {
    constructor(window, langLink, links, queryInput, state) {
        window.addEventListener("keydown", (event) => {
            if (window.location.href.includes("debug")) {
                console.log(event.key);
            }
            if (event.ctrlKey && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
                langLink.click();
                return;
            }
            if (event.key === 'Escape') {
                if (!queryInput.hasFocus()) {
                    queryInput.focus();
                }
                else {
                    state.setQuery('');
                    event.preventDefault();
                }
                return;
            }
            if (event.key === 'Enter') {
                let selected = links.getSelected();
                if (selected.length === 1) {
                    window.open(selected[0].element.href, "_blank");
                }
                return;
            }
        });
    }
}

class AddressBar {
    constructor(state) {
        state.subscribe(s => {
            window.location.hash = '#' + s.serialize();
        })
    }

    getHash() {
        return window.location.hash.substring(1);
    }
}

function initPage() {
    window.addEventListener('load', () => {
        let state = new State();
        let addressBar = new AddressBar(state);
        let langLink = new LangLink(window, document, state);
        let links = new Links(document, state);
        let queryInput = new QueryInput(document, state, links);
        let keyboardHandler = new KeyboardHandler(window, langLink, links, queryInput, state);

        state.read(addressBar.getHash());

        queryInput.focus();
    });
}

initPage();
