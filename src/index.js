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
 * @param decoratorName {string}
 * @returns {*}
 */
let getDecorator = function(decoratorName) {

    if(!this.node.decorators){
        return [];
    }

    return this.node.decorators.filter(deco => {
        let { name } = deco.expression.callee;
        if(name === decoratorName){
            return true;
        }
    });
};

let addImports = function(path, imports, programImports, programBody) {


    imports.forEach(imp => {

        let result = programImports.filter(prImp =>
            imp.SOURCE === prImp.SOURCE && imp.SOURCE === prImp.SOURCE
        );

        if(!result.length){
            let createdImportAst = this::buildImport(imp, path);
            programBody.unshift(createdImportAst);
        }
    });
};

/**
 * buildImport
 * @param data {object}
 * @param path {object}
 * @returns {Object}
 */
let buildImport = function(data, path) {

    let { IMPORT_NAME, SOURCE } = data;
    let IMPORT_NAME_UID = path.scope.generateUidIdentifier(IMPORT_NAME).name;

    this.cache.set(`${IMPORT_NAME}-value`, IMPORT_NAME_UID);
    this.cache.set(`${IMPORT_NAME}-value-orig`, IMPORT_NAME);

    return buildImportAst({
        IMPORT_NAME: IMPORT_NAME_UID,
        SOURCE: SOURCE
    });
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
            this.cache.set('decorator', false);
        },
        post(){
            this.cache.clear();
        },
        visitor: {
            Program(path, state) {

                let optionsImports = state.opts.imports;
                let programBody = path.node.body;

                if(optionsImports.length !== 2){
                    throw new Error('Please pass Register and storage');
                }

                /**
                 * Check that @component exist
                 */
                let self = this;
                path.traverse({
                    ClassDeclaration(path) {
                        let component = path::getDecorator('component');
                        if(component.length){
                            self.cache.set('decorator', true);
                        }
                    }
                });
                if(!self.cache.get('decorator')){
                    return;
                }

                /**
                 * Check that required imports already imported
                 */
                let programImports = [];
                path.traverse({
                    ImportDeclaration(path) {

                        let importPath = path.node.source.value;
                        if(!importPath){
                            return;
                        }

                        let imports = path.node.specifiers.map(({ local }) => {
                            return {
                                IMPORT_NAME: local.name,
                                SOURCE: importPath,
                            };
                        });
                        programImports.push(...imports);
                    }
                });

                this::addImports(path, optionsImports, programImports, programBody);


            },
            ClassDeclaration(path) {

                let component = path::getDecorator('component');
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
