// 虚拟节点相关

export function vnode(tag, props, key, children, text){ // 工厂函数
    return {
        tag, // 表示当前标签名
        props, // 表示的是当前标签上的属性
        key, // 唯一标识 用户可能传递
        children,
        text
    }
}
