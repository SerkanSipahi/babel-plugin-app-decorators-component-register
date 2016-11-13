## babel-plugin-app-decorators-component-register
Babel Plugin for extend HTMLElement by options for Babeljs v6.x

<p>
    <a href="https://david-dm.org/SerkanSipahi/babel-plugin-app-decorators-component-register"><img src="https://david-dm.org/SerkanSipahi/david.svg" alt="Dependency Status"></a>
    <a href="https://david-dm.org/SerkanSipahi/babel-plugin-app-decorators-component-register/?type=dev"><img src="https://david-dm.org/SerkanSipahi/david/dev-status.svg" alt="devDependency Status"></a>
</p>

### Installation

```sh
$ npm install babel-plugin-app-decorators-component-register --save
```

### Usage

#### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["app-decorators-component-register"]
}
```

**.babelrc options**
```js
"plugins": [
    ["app-decorators-component-register", {
        imports: [
            { importName: 'Register', source: 'app-decorators-helper/register-document' },
            { importName: 'storage',  source: 'app-decorators-helper/registry-storage' },
        ],
    }]
]
```

#### Via CLI

```sh
$ babel --plugins app-decorators-component-register script.js
```

#### Via Node API

```js
require('babel').transform('code', {
  plugins: ['app-decorators-component-register']
});
```

### The goal of this babel-plugin is for app-decorators @component:

#### Example 1
code:
```js
@component()
class Foo {

}
```
transformed:
```js
import * as _register from 'app-decorators-helper/register-document';
import * as _storage from 'app-decorators-helper/registry-storage';

@component()
class Foo {

}

_register.Register.customElement(Foo, _storage.storage);
```


#### Tests
```bash
git clone https://github.com/SerkanSipahi/babel-plugin-app-decorators-component-register.git
cd babel-plugin-app-decorators-component-register
make install
make test
```
