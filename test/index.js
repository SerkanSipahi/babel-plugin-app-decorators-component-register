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
                    { IMPORT_NAME: 'Register', SOURCE: 'app-decorators-helper/register-document' },
                    { IMPORT_NAME: 'storage',  SOURCE: 'app-decorators-helper/registry-storage' },
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
            class Foo {}`;

        let expected = `
            import * as _Register from "app-decorators-helper/register-document";
            import * as _storage from "app-decorators-helper/registry-storage";

            @component()
            class Foo {}
            _Register.Register.customElement(Foo, _storage.storage);`;

        let generated = transformCode(actual);

        assert.equal(trim(generated), trim(expected));

    });

    it('should add required import statements only once even on multi @component', () => {

        let actual =`
            @component()
            class Foo {}

            @component()
            class Bar {}`;

        let expected = `
            import * as _Register from "app-decorators-helper/register-document";
            import * as _storage from "app-decorators-helper/registry-storage";
            
            @component()
            class Foo {}
            _Register.Register.customElement(Foo, _storage.storage);

            @component()
            class Bar {}
            _Register.Register.customElement(Bar, _storage.storage);`;

        let generated = transformCode(actual);

        assert.equal(trim(generated), trim(expected));

    });

    it('should add required import statements only once even on multi @component + mixed code', () => {

        let actual =`
            @component()
            class Foo {}

            class Baz {}
            function Kaz() {}

            @component()
            class Bar {}`;

        let expected = `
            import * as _Register from "app-decorators-helper/register-document";
            import * as _storage from "app-decorators-helper/registry-storage";
            
            @component()
            class Foo {}
            _Register.Register.customElement(Foo, _storage.storage);

            class Baz {}
            function Kaz() {}

            @component()
            class Bar {}
            _Register.Register.customElement(Bar, _storage.storage);`;

        let generated = transformCode(actual);

        assert.equal(trim(generated), trim(expected));

    });

    it('should add required import statements even if other imports exists', () => {

        let actual =`
            import a from "a/foo";
            import b from "b/foo";

            @component()
            class Foo {}`;

        let expected = `
            import * as _Register from "app-decorators-helper/register-document";
            import * as _storage from "app-decorators-helper/registry-storage";
            import a from "a/foo";
            import b from "b/foo";

            @component()
            class Foo {}
            _Register.Register.customElement(Foo, _storage.storage);`;

        let generated = transformCode(actual);

        assert.equal(trim(generated), trim(expected));

    });

    it('should resolve local scope conflicts', () => {

        let actual =`
            import _Register from "a/foo";
            import * as _storage from "b/foo";

            @component()
            class Foo {}`;

        let expected = `
            import * as _Register2 from "app-decorators-helper/register-document";
            import * as _storage2 from "app-decorators-helper/registry-storage";
            import _Register from "a/foo";
            import * as _storage from "b/foo";

            @component()
            class Foo {}
            _Register2.Register.customElement(Foo, _storage2.storage);`;

        let generated = transformCode(actual);

        assert.equal(trim(generated), trim(expected));

    });

    it('should insert Register.customElement exact after class Foo', () => {

        let actual =`
            @component()
            class Foo {}
            let element = Foo.create();`;

        let expected = `
            import * as _Register from "app-decorators-helper/register-document";
            import * as _storage from "app-decorators-helper/registry-storage";

            @component()
            class Foo {}
            _Register.Register.customElement(Foo, _storage.storage);
            let element = Foo.create();`;

        let generated = transformCode(actual);

        assert.equal(trim(generated), trim(expected));

    });

    it('should add required import statements and Register function if even export exists', () => {

        let actual =`
            @component()
            class Foo {}
            let element = Foo.create();

            export { Foo };`;

        let expected = `
            import * as _Register from "app-decorators-helper/register-document";
            import * as _storage from "app-decorators-helper/registry-storage";

            @component()
            class Foo {}
            _Register.Register.customElement(Foo, _storage.storage);
            let element = Foo.create();

            export { Foo };`;

        let generated = transformCode(actual);

        assert.equal(trim(generated), trim(expected));

    });

    it('should do nothing if no @components found', () => {

        let actual =`
            class Bar {}

            @view()
            class Foo {}
            let element = Foo.create();

            export { Foo };`;

        let expected = `
            class Bar {}

            @view()
            class Foo {}
            let element = Foo.create();

            export { Foo };`;

        let generated = transformCode(actual);

        assert.equal(trim(generated), trim(expected));

    });

});
