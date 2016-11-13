import assert from 'assert';
import { transform } from 'babel-core';
import appDecoratorComponentRegister from'../src/index';
import syntaxDecorator from 'babel-plugin-syntax-decorators';

function trim(str) {
    return str.replace(/^\s+/gm, '');
}

function transformCode(code){

    let generated = transform(code, {
        plugins: [
            [appDecoratorComponentRegister, {
                imports: [
                    { importName: 'Register', source: 'app-decorators-helper/register-document' },
                    { importName: 'storage',  source: 'app-decorators-helper/registry-storage' },
                ],
            }],
            syntaxDecorator
        ]
    });

    return generated.code;
}

describe('@component', () => {

    it('should add required import statements and Register function', () => {

        let actual =`
            @component()
            class Foo {
            }`;

        let expected = `
            import * as _register from 'app-decorators-helper/register-document';
            import * as _storage from 'app-decorators-helper/registry-storage';
            
            @component()
            
            class Foo {
            }
            _register.Register.customElement(Foo, _storage.storage);`;

        let generated = transformCode(actual);

        assert.equal(trim(generated), trim(expected));

    });

    it('should add required import statements only once even on multi @component', () => {

        let actual =`
            @component()
            class Foo {
            }

            @component()
            class Bar {
            }`;

        let expected = `
            import * as _register from 'app-decorators-helper/register-document';
            import * as _storage from 'app-decorators-helper/registry-storage';
            
            @component()            
            class Foo {
            }
            _register.Register.customElement(Foo, _storage.storage);

            @component()            
            class Bar {
            }
            _register.Register.customElement(Bar, _storage.storage);`;

        let generated = transformCode(actual);

        assert.equal(trim(generated), trim(expected));

    });

    it('should add required import statements only once even on multi @component + mixed code', () => {

        let actual =`
            @component()
            class Foo {
            }

            class Baz {
            }
            function Kaz() {
            }

            @component()
            class Bar {
            }`;

        let expected = `
            import * as _register from 'app-decorators-helper/register-document';
            import * as _storage from 'app-decorators-helper/registry-storage';
            
            @component()            
            class Foo {
            }
            _register.Register.customElement(Foo, _storage.storage);

            class Baz {
            }
            function Kaz() {
            }

            @component()            
            class Bar {
            }
            _register.Register.customElement(Bar, _storage.storage);`;

        let generated = transformCode(actual);

        assert.equal(trim(generated), trim(expected));

    });

});
