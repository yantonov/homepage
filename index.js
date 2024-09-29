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

class Links {
    constructor(document, state) {
        let self = this;
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
            let query = state.query.toLowerCase().trim();
            if (query.length === 0) {
                return;
            }
            
            let selected = self.links.filter(item => {
                let name = item.name;
                return isCharsIncludedInOrder(query, name);
            })
                .forEach(item => {
                    item.element.classList.add('link-highlighted');
                });
        });
    }

    reset() {
        this.links
            .forEach(link => {
                link.element.classList.remove('link-highlighted');
            });
    }

    getSelected() {
        return this.links.filter(item => {
            let el = item.element;
            return el.classList.contains('link-highlighted');
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
    }

    focus() {
        this.element.focus();
    }
}

function initPage() {
    window.addEventListener('load', () => {
        let state = new State();
        let langLink = new LangLink(window, document);
        let links = new Links(document, state);
        let queryInput = new QueryInput(document, state, links);
        queryInput.focus();
        
        window.addEventListener("keydown", (event) => {
            if (window.location.href.includes("debug")) {
                console.log(event.key);
            }          
            if (event.ctrlKey && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
                langLink.click();
            }
            if (event.key === 'Escape') {
                links.reset();
                queryInput.reset();
                event.preventDefault();
            }
            if (event.key === 'Enter') {
                let selected = links.getSelected();
                if (selected.length === 1) {
                    window.open(selected[0].element.href, "_blank");
                }
                
            }
        });
    });
}

initPage();
