# [Level](https://github.com/Level/abstract-level) abstraction for VK Bridge
Use it for easy for getting access to easy database interface around [VK Bridge Storage](https://dev.vk.com/ru/bridge/VKWebAppStorageGet)

#### [API Reference](https://github.com/Level/abstract-level#table-of-contents)

#### Example
```ts
import {VkBridgeLevel} from 'vk-bridge-level'

const db = new VkBridgeLevel({ valueEncoding: 'json' }) // valueEncoding will auto encode and encode your objects to json
const key = 'key' 
const value = {test: 'test'} // object to store
await db.put(key, value)
await db.get(key).then(console.log) // will return value from storage
await db.iterator().next().then(console.log) // will return
```

### Todo
- [ ] Write tests on bridge mock
