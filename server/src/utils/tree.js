const Queue = require("./queue");

class Node {
    constructor(data) {
        this.data = data;
        // this.parent = null
        this.children = []
    }

    addChildNode(child) {
        // if(!this.firstChild)
        //     this.firstChild = child
        // else{
        //     let currentChild = this.firstChild
        //     while(currentChild.nextSibling){
        //         currentChild = currentChild.nextSibling
        //     }
        //     currentChild.nextSibling = child
        // }
        // child.parent = this
        this.children.push(child)
    }
}

class Tree {
    constructor() {
        this.root = {}
    }

    setRoot(root) {
        this.root = root
    }

    bfsTraverse() {
        const ret = []
        const q = new Queue()
        let currentNode = this.root
        while (currentNode) {
            ret.push(currentNode);
            for (let i = 0; i < currentNode.children.length; i++) {
                q.enqueue(currentNode.children[i]);
            }
            currentNode = q.dequeue();
        }
        return ret
    }

    insertDataToNode(data) {
        if (data) {
            const arr = []
            const q = new Queue()
            let currentNode = this.root
            while (currentNode) {
                if (currentNode?.data?.url == data.url) {
                    currentNode.data = data
                    return currentNode
                }
                arr.push(currentNode);
                for (let i = 0; i < currentNode.children.length; i++) {
                    q.enqueue(currentNode.children[i]);
                }
                currentNode = q.dequeue();
            }
        }
        console.log("can't find", data.url)
        return null
    }

}

module.exports = {
    Node,
    Tree
}