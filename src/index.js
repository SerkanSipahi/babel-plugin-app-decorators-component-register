import * as t from "babel-types";
import template from 'babel-template';

/**
 * Template for import statements
 */
let compileImportTemplate = template(`
    import * as IMPORT_NAME from 'SOURCE';
`, { sourceType: "module" });

/**
 * Template for "Register.customElement"
 */
let compileRegisterTemplate = template(`
    REGISTER_VALUE.REGISTER_VALUE_ORIG.customElement(
        CLASS_NAME, STORAGE_VALUE.STORAGE_VALUE_ORIG
    );
`);

/**
 * buildImportAst
 * @param data {{IMPORT_NAME: string, SOURCE: string}}
 * @returns {object} ast
 */
let buildImportAst = data => {

    let { IMPORT_NAME, SOURCE } = data;
    let ast = compileImportTemplate({
        IMPORT_NAME : t.identifier(IMPORT_NAME),
    });
    ast.source.value = SOURCE;
    ast._$importName = IMPORT_NAME;
    ast._$source = SOURCE;

    return ast;
};

/**
 * buildRegisterAst
 * @param data {{
     *     CLASS_NAME: string,
     *     REGISTER_VALUE: string,
     *     REGISTER_VALUE_ORIG: string,
     *     STORAGE_VALUE: string,
     *     STORAGE_VALUE_ORIG: string
     * }}
 * @returns {object}
 */
let buildRegisterAst = data => {

    return compileRegisterTemplate({
        CLASS_NAME : t.identifier(data.CLASS_NAME),
        REGISTER_VALUE: t.identifier(data.REGISTER_VALUE),
        REGISTER_VALUE_ORIG: t.identifier(data.REGISTER_VALUE_ORIG),
        STORAGE_VALUE: t.identifier(data.STORAGE_VALUE),
        STORAGE_VALUE_ORIG: t.identifier(data.STORAGE_VALUE_ORIG),
    });
};

/**
 * getDecorator
 * @param path {object}
 * @param decoratorName {string}
 * @returns {*}
 */
let getDecorator = (path, decoratorName) => {

    if(!path.node.decorators){
        return false;
    }

    return path.node.decorators.filter(deco => {
        let { name } = deco.expression.callee;
        if(name === decoratorName){
            return true;
        }
    });
};

/**
 * importsAppended
 * @param imports {array}
 * @param programBody {array}
 * @returns {boolean}
 */
let importsAppended = (imports, programBody) => {

    let importLimit = 0;
    imports.forEach(imp => {
        programBody.forEach(pB =>
            (pB._$source === imp.SOURCE ? importLimit++ : null)
        );
    });
    return importLimit === imports.length;
};

/**
 * getClassName
 * @param path
 * @returns {string};
 */
let getClassName = path => path.node.id.name;

function plugin() {

    return {
        pre(){
            this.cache = new Map();
        },
        post(){
            this.cache.clear();
        },
        visitor: {
            Program(path, state) {

                if(state.opts.imports.length !== 2){
                    throw new Error('Please pass Register and storage');
                }

                let imports = state.opts.imports;
                imports = imports.map(data => {

                    let { IMPORT_NAME, SOURCE } = data;
                    let IMPORT_NAME_UID = path.scope.generateUidIdentifier(IMPORT_NAME).name;

                    this.cache.set(`${IMPORT_NAME}-value`, IMPORT_NAME_UID);
                    this.cache.set(`${IMPORT_NAME}-value-orig`, IMPORT_NAME);

                    return buildImportAst({
                        IMPORT_NAME: IMPORT_NAME_UID,
                        SOURCE: SOURCE
                    });
                });

                let cachedImports = state.opts.imports;
                let cachedProgramBody = path.node.body;

                if(!importsAppended(cachedImports, cachedProgramBody)){
                    cachedProgramBody.unshift(...imports);
                }
            },
            ClassDeclaration(path) {

                let component = getDecorator(path, 'component');
                if(!component.length){
                    return;
                }

                // build Register ast
                let registerAst = buildRegisterAst({
                    CLASS_NAME         : getClassName(path),
                    REGISTER_VALUE     : this.cache.get('Register-value'),
                    REGISTER_VALUE_ORIG: this.cache.get('Register-value-orig'),
                    STORAGE_VALUE      : this.cache.get('storage-value'),
                    STORAGE_VALUE_ORIG : this.cache.get('storage-value-orig'),
                });
                path.insertAfter(registerAst);

            },
        },
    };
}

export default plugin;
