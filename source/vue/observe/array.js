import { observe } from ".";
// 主要要做的事就是拦截用户调用的push shift unshift pop reverse sort splice
// 以上方法会改变数组长度

// 先获取老的数组的方法 只改写这7个方法
let oldArrayProtoMethods = Array.prototype;

// 拷贝的一个新的对象 可以查找到 老的方法
export let arrayMethods = Object.create(oldArrayProtoMethods);

// 原型链 prototype  __proto__
let methods = [
    'push',
    'shift',
    'pop',
    'unshift',
    'reverse',
    'sort',
    'splice'
];

export function observerArray(inserted){ // 要循环数组一次对数组中每一项进行观测
    for(let i = 0 ; i < inserted.length;i++){
        observe(inserted[i]); // 没有 对数组的索引进行监控
    }
}
export function dependArray(value){ // 递归收集数组中的依赖
    for(let i = 0 ; i < value.length;i++){
        let currentItem = value[i]; // 可能也是一个数组
        currentItem.__ob__ && currentItem.__ob__.dep.depend();
        if(Array.isArray(currentItem)){
            dependArray(currentItem); // 不停的收集数组中的依赖关系
        }
    }
}

methods.forEach(method => { // arr.push(1,2,3)  args=[1,2,3]
    arrayMethods[method] = function (...args) { // 函数劫持  切片编程
        let r = oldArrayProtoMethods[method].apply(this, args);
        console.log('数组更新');

        // 如果新增的属性 也是对象类型 我们需要对这个对象 也进行观察 observe
        let inserted;
        switch (method) { // 只对 新增的属性 再次进行观察 其他方法没有新增属性
            case 'push':
            case 'unshift':
                inserted = args;
                break;
            case 'splice':
                inserted = args.slice(2);  // 获取splice 新增的内容
            default:
                break;
        }
        if(inserted) observerArray(inserted);

        this.__ob__.dep.notify(); // 通知视图更新

        return r
    }
})
