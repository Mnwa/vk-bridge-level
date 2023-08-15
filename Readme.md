# [Level](https://github.com/Level/abstract-level) abstraction for VK Bridge
Use it for easy for getting access to easy database interface around [VK Bridge Storage](https://dev.vk.com/ru/bridge/VKWebAppStorageGet)

## Examples
```ts
import {VkBridgeLevel} from 'vk-bridge-level'

const db = new VkBridgeLevel()
const key = 'key' 
const value = {test: 'test'} // object to store
await db.put(key, value, { valueEncoding: 'json' })
await db.get(key) // will return value from storage
```

## Todo
- [ ] Add input size validation
- [ ] Add example 
- [ ] Write tests on bridge mock
