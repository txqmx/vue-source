let id = 0;
import {pushTarget,popTarget} from './dep'
import {util} from "../util";

class Watcher {
    /**
     * @param {*} vm 当前组件的实例 new Vue
     * @param {*} exprOrFn 用户可能传入的是一个表达式 也有可能传入的是一个函数
     * @param {*} cb 用户传入的回调函数 vm.$watch('msg',cb)
     * @param {*} opts // 一些其他参数
     */
    constructor(vm, exprOrFn, cb=()=>{}, opts={}){
        this.vm = vm;
        this.exprOrFn = exprOrFn;
        if(typeof exprOrFn === 'function'){
            this.getter = exprOrFn; // getter就是new Watcher传入的第二个函数
        } else {
            this.getter = function () { // 如果调用此方方法 会将vm上对应的表达式取出来
                return util.getValue(vm, exprOrFn)
            }
        }
        if(opts.user){ // 标识是用户自己写的watcher
            this.user = true

        }
        this.lazy = opts.lazy; // 如果这个值为true 说明他是计算属性
        this.dirty = this.lazy;
        this.cb = cb;
        this.deps = [];
        this.depsId = new Set(); // set 不能重复
        this.opts = opts;
        this.id = id++;
        this.immediate = opts.immediate;
        // 创建watcher的时候 先将表达式对应的值取出来 （老值）
        // 如果当前我们是计算属性的话 不会默认调用get方法
        this.value = this.lazy ? undefined : this.get(); // 默认创建一个watcher 会调用自身get方法
        if(this.immediate){ // 如果有immediate 就直接运行用户定义的函数
            this.cb(this.value);
        }
    }
    get(){
        // Dep.target = watcher(用户)
        pushTarget(this); //渲染watcher Dep.target = watcher msg变化了 需要让这个watcher重新执行
        // 默认创建watcher 会执行此方法

        // dep=[watcher]
        // fullName(){return this.firstName + this.lastName}
        // 这个函数调用时就会将当前的计算属性watcher存起来
        let value = this.getter.call(this.vm); // 让这个当前传入的函数执行

        popTarget(); // Dep.target = undefined

        return value
    }
    evaluate(){
        this.value = this.get();
        this.dirty = false
    }
    addDep(dep){ // 同一个watcher 不应该重复记录dep 让watcher和dep 互相记忆
        let id = dep.id; // msg de dep
        if(!this.depsId.has(id)){
            this.depsId.add(id);
            this.deps.push(dep) // 就让watcher 记住了当前的dep
            dep.addSub(this);
        }
    }
    depend(){
        let i = this.deps.length
        while (i--) {
            this.deps[i].depend()
        }
    }
    update(){ // 如果立即调用get 会导致页面刷新 应该异步来更新
        // this.get();
        if(this.lazy){ // 如果是计算属性
            this.dirty = true
        }else{
            queueWatcher(this);
        }
    }
    run(){
        let value = this.get(); // 新值
        if(this.value !== value){
            this.cb(value, this.value)
        }
    }
}

let has = {};
let queue = []; // watch 存起来
function flushQueue() {
    // 等待当前这一轮全部更新后 再去让watcher依次执行
    queue.forEach(watcher => watcher.run());
    has = {}; // 恢复正常 下一轮更新时继续使用
    queue = [];
}
function queueWatcher(watcher) { // 对重复的watcher进行过滤操作
    let id = watcher.id;
    if(has[id] == null){
        has[id] = true;
        queue.push(watcher); // 相同的watcher只会存一个到queue中

        // 延迟情况队列
        // setTimeout(flushQueue,0); // 异步方法会等待所有同步方法执行完毕后调用此方法
        nextTick(flushQueue)
    }
}

let callbacks = [];
function flushCallbacks() {
    callbacks.forEach(cb => cb())
}
function nextTick(cb) { // cb就是flushQueue
    callbacks.push(cb);

    // 要异步刷新这个callbacks, 获取一个异步方法
    // 异步是分执行顺序的 会先执行(promise mutationObserver)微任务 （setImmediate setTimeout）宏任务
    let timerFunc = () => {
        flushCallbacks();
    };
    if(Promise){ // then方法时异步的
        return Promise.resolve().then(timerFunc)
    }
    if(MutationObserver){ // MutationObserver 也是一个异步方法
        let observe = new MutationObserver(timerFunc); // h5的api
        let textNode = document.createTextNode(1);
        observe.observe(textNode, {characterData: true});
        textNode.textContent = 2;
        return
    }
    if(setImmediate){
        return setImmediate(timerFunc)
    }
    setTimeout(timerFunc, 0);

}

// 等待页面更新后再去获取dom元素

// 渲染使用他 计算属性也要用他 vm.watch 也用他
export default Watcher
