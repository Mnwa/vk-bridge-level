# [Level](https://github.com/Level/abstract-level) abstraction for VK Bridge
![level badge](https://leveljs.org/img/badge.svg)
[![npm](https://img.shields.io/npm/v/vk-bridge-level.svg)](https://www.npmjs.com/package/vk-bridge-level)

Use it for easy for getting access to easy database interface around [VK Bridge Storage](https://dev.vk.com/ru/bridge/VKWebAppStorageGet)

## Install
### NPM
```shell
npm i vk-bridge-level
```
### Yarn
```shell
yarn add vk-bridge-level
```
## Usage

### [API Reference](https://github.com/Level/abstract-level#table-of-contents)
### Example
```ts
import {VkBridgeLevel} from 'vk-bridge-level'
import bridge from '@vkontakte/vk-bridge';

const db = new VkBridgeLevel(bridge, {valueEncoding: 'json'}) // valueEncoding will auto encode and decode your objects to json
const key = 'key'
const value = {test: 'test'} // object to store
await db.put(key, value)
await db.get(key).then(console.log) // will return value from storage
await db.iterator().next().then(console.log) // will return
```
