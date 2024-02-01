type IdItem = number | string;

interface IItem {
    id: IdItem;
    parent: IdItem | 'root';
    type?: string | null;
}

abstract class AbstractTreeStore {
    abstract getAll(): IItem[];
    abstract getItem(id: IItem['id']): IItem | null;
    abstract getChildren(id: IItem['id']): IItem[];
    abstract getAllChildren(id: IItem['id']): IItem[];
    abstract getAllParents(id: IItem['id']): IItem[];
}

/**
 * Вообще по хорошему в этом классе избавиться от связи с this.items. Но в рамках тестового задания я всё таки принебрегу этим
 */
class Tree {
    protected head: TreeNode | null;
    private items: IItem[];

    constructor(items: IItem[]) {
        this.head = null;
        this.items = items;

        this.createTree();
    }

    /**
     * Метод для нахождения элемента
     * @param id 
     * @returns 
     * P.S. Немного не понял. "Порядок id не гарантируется" Если я правильно понял, то массив может быть не отсортирован, но всё равно у родителя должен быть id 1
     * Даже если это не так, то можно написать отдельный метод по нахождение parent root, хотя мне это кажется бессмысленным
     */
    private findItem(id: IItem['id'], items: IItem[]): IItem | undefined {
        return items.find(item => item.id === id);
    }

    /**
     * Получение всех детей в массиве
     * @param id 
     * @param items 
     * @returns 
     */
    private getChildrensNode(id: IItem['id'], items: IItem[]): TreeNode[] {
        const childrens = [] as TreeNode[];

        for (const item of items) {
            if(item.parent === id) {
                childrens.push(new TreeNode(item));
            }
        }

        return childrens;
    }

    /**
     * Метод в котором стартует создание дерева
     * Тут мы ищем корень
     * Как раз что и писал по поводу id. Корневой элемент содержит id 1 и parent root. Я стал искать по id. У меня есть неясности, по этому оставил так как есть
     * @returns 
     */
    private createTree() {
        if(!this.head) {
            const item = this.findItem(1, this.items);

            if(item) {
                this.head = new TreeNode(item)
            } else {
                return;
            };
        }

        const childrens = this.getChildrensNode(this.head.id, this.items);
        this.createChildrens(childrens, this.head);
    }

    /**
     * Метод для создания дочерних элементов дерева
     * @param childrens 
     * @param parent 
     */
    private createChildrens(childrens: TreeNode[], parent: TreeNode) {
        parent.childrens = childrens;

        for (const child of parent.childrens) {
            const childrens = this.getChildrensNode(child.id, this.items);
            this.createChildrens(childrens, child);
        }
    }
}

/**
 * Главный класс, в котором содержится вся логика работы с деревом
 */
class TreeStore extends Tree implements AbstractTreeStore {
    constructor(items: IItem[]) {
        super(items);
    }

    /**
     * Получение всех элементов дерева
     * @returns 
     */
    getAll(): IItem[]  {
        if(this.head) return this.getTransformedArrayNodes(this.head);

        return []
    }
    
    /**
     * Получение конкретного элемента дерева
     * @param id 
     * @returns 
     */
    getItem(id: IItem['id']): IItem | null {
        if(this.head) {
            const node = this.searchInDepthItem(this.head, id);

            return node ? this.getOriginalObject(node) : node;
        };
        
        return null
    }

    /**
     * Получение всех детей родителя
     * @param id 
     * @returns 
     */
    getChildren(id: IItem['id']): IItem[] {
        if(this.head) {
            const node = this.searchInDepthItem(this.head, id);

            if (node && node.childrens.length) {
                return node.childrens.map(child => this.getOriginalObject(child));
            }
        }
      
        return [];
    }

    /**
     * Получение всех детей и детей потомков
     * @param id 
     * @returns 
     */
    getAllChildren(id: IItem['id']): IItem[] {
        if(this.head) {
            const node = this.searchInDepthItem(this.head, id);

            if(node && node.childrens.length) {
                return this.getTransformedArrayNodes(node, false);
            }
        }

        return [];
    }

    /**
     * Получение всей цепочки родителей элемента
     * @param id 
     * @returns 
     */
    getAllParents(id: IItem['id']): IItem[] {
        if(this.head) {
            return this.getChainParents(this.head, id);
        }

        return [];
    }

    /**
     * Метод для получения цепочки родителей
     * Реализация рекурсивным способом по алгоритму DFS
     * @param node 
     * @param id 
     * @param items 
     * @returns 
     */
    private getChainParents(node: TreeNode, id: IItem['id'], items = [] as IItem[]): IItem[] {
        if(node.id === id) return items;

        for (const child of node.childrens) {
            let result = this.getChainParents(child, id, items);
            items.push(this.getOriginalObject(node));

            if (result) {
                return items;
            }
        }

        return [];
    }

    /**
     * Поиск элемента в глубину
     * Реализация рекурсивным способом по алгоритму DFS
     * @param node 
     * @param id 
     * @returns 
     */
    private searchInDepthItem(node: TreeNode, id: IItem['id']): TreeNode | null {
        if(node.id === id) return node;

        for (const child of node.childrens) {
            let result = this.searchInDepthItem(child, id);

            if (result) {
                return result;
            }
        }

        return null;
    } 

    /**
     * Метод для получения всех элементов нациная от какого то корня
     * @param parentNode 
     * @param isNeedFirstitem - необходим для другого метода, когда нам не нужен первый элемент
     * @returns 
     */
    private getTransformedArrayNodes(parentNode: TreeNode, isNeedFirstitem = true) {
        const nodes: IItem[] = isNeedFirstitem ? [this.getOriginalObject(parentNode)] : [];

        for (const child of parentNode.childrens) {
            nodes.push(...this.getTransformedArrayNodes(child));
        }
    
        return nodes;
    }

    /**
     * Метод для получения структуры объекта в первозданном виде
     * @param node 
     * @returns 
     */
    private getOriginalObject(node: TreeNode) {
        return {
            id: node.id,
            parent: node.parent,
            ...(node.type !== undefined && { type: node.type }),
        }
    }
}

/**
 * По факту это класс конструктор для реализации модели дерева
 */
class TreeNode {
    id: IItem['id'];
    parent: IItem['parent'];
    type: IItem['type'];
    childrens: TreeNode[];

    constructor({id, parent, type = undefined}: IItem) {
        this.id = id;
        this.parent = parent;
        this.type = type;
        this.childrens = [];
    }
}

const items = [
    { id: 1, parent: 'root' },
    { id: 2, parent: 1, type: 'test' },
    { id: 3, parent: 1, type: 'test' },

    { id: 4, parent: 2, type: 'test' },
    { id: 5, parent: 2, type: 'test' },
    { id: 6, parent: 2, type: 'test' },

    { id: 7, parent: 4, type: null },
    { id: 8, parent: 4, type: null },
];

const treeStore = new TreeStore(items);

console.log("getAll()", treeStore.getAll());
console.log("getItem(2)", treeStore.getItem(2));
console.log("getChildren(4)", treeStore.getChildren(4));
console.log("getChildren(5)", treeStore.getChildren(5));
console.log("getChildren(2)", treeStore.getChildren(2));
console.log("getAllChildren(2)", treeStore.getAllChildren(2));
console.log("getAllParents(7)", treeStore.getAllParents(7));