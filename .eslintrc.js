module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "rules": {
        "accessor-pairs": "error",
        "array-bracket-newline": "off",
        "array-bracket-spacing": "off",
        "array-callback-return": "off",
        "array-element-newline": "off",
        "arrow-body-style": "off",
        "arrow-parens": "off",
        "arrow-spacing": [
            "error",
            {
                "after": true,
                "before": true
            }
        ],
        "block-scoped-var": "off",
        "block-spacing": "off",
        "brace-style": "off",
        "camelcase": "off",
        "capitalized-comments": "off",
        "class-methods-use-this": "error",
        "comma-dangle": "off",
        "comma-spacing": "off",
        "comma-style": [
            "error",
            "last"
        ],
        "complexity": "off",
        "computed-property-spacing": [
            "error",
            "never"
        ],
        "consistent-return": "off",
        "consistent-this": "error",
        "curly": "off",
        "default-case": "off",
        "default-case-last": "error",
        "default-param-last": "off",
        "dot-location": [
            "error",
            "property"
        ],
        "dot-notation": "off",
        "eol-last": "off",
        "eqeqeq": "off",
        "func-call-spacing": "error",
        "func-name-matching": "error",
        "func-names": "off",
        "func-style": [
            "error",
            "declaration",
            {
                "allowArrowFunctions": true
            }
        ],
        "function-call-argument-newline": [
            "error",
            "consistent"
        ],
        "function-paren-newline": "off",
        "generator-star-spacing": "error",
        "grouped-accessor-pairs": "error",
        "guard-for-in": "off",
        "id-denylist": "error",
        "id-length": "off",
        "id-match": "error",
        "implicit-arrow-linebreak": "off",
        "indent": "off",
        "init-declarations": "off",
        "jsx-quotes": "error",
        "key-spacing": "off",
        "keyword-spacing": "off",
        "line-comment-position": "off",
        "linebreak-style": [
            "error",
            "unix"
        ],
        "lines-around-comment": "off",
        "lines-between-class-members": [
            "error",
            "always"
        ],
        "max-classes-per-file": "error",
        "max-depth": "off",
        "max-len": "off",
        "max-lines": "off",
        "max-lines-per-function": "off",
        "max-nested-callbacks": "error",
        "max-params": "off",
        "max-statements": "off",
        "max-statements-per-line": "off",
        "multiline-comment-style": "off",
        "multiline-ternary": "off",
        "new-parens": "error",
        "newline-per-chained-call": "off",
        "no-alert": "error",
        "no-array-constructor": "error",
        "no-await-in-loop": "off",
        "no-bitwise": "error",
        "no-caller": "error",
        "no-cond-assign": [
            "error",
            "except-parens"
        ],
        "no-confusing-arrow": [
            "error",
            {
                "allowParens": true
            }
        ],
        "no-console": "off",
        "no-constructor-return": "error",
        "no-continue": "error",
        "no-div-regex": "error",
        "no-duplicate-imports": "off",
        "no-else-return": "off",
        "no-empty-function": "off",
        "no-eq-null": "off",
        "no-eval": "error",
        "no-extend-native": "error",
        "no-extra-bind": "error",
        "no-extra-label": "error",
        "no-extra-parens": "off",
        "no-floating-decimal": "error",
        "no-implicit-globals": "error",
        "no-implied-eval": "error",
        "no-inline-comments": "off",
        "no-inner-declarations": [
            "error",
            "functions"
        ],
        "no-invalid-this": "off",
        "no-iterator": "error",
        "no-label-var": "error",
        "no-labels": "error",
        "no-lone-blocks": "error",
        "no-lonely-if": "off",
        "no-loop-func": "off",
        "no-loss-of-precision": "error",
        "no-magic-numbers": "off",
        "no-mixed-operators": "off",
        "no-multi-assign": "error",
        "no-multi-spaces": "off",
        "no-multi-str": "error",
        "no-multiple-empty-lines": "error",
        "no-negated-condition": "off",
        "no-nested-ternary": "off",
        "no-new": "error",
        "no-new-func": "error",
        "no-new-object": "error",
        "no-new-wrappers": "error",
        "no-nonoctal-decimal-escape": "error",
        "no-octal-escape": "error",
        "no-param-reassign": "off",
        "no-plusplus": "off",
        "no-promise-executor-return": "off",
        "no-proto": "error",
        "no-restricted-exports": "error",
        "no-restricted-globals": "error",
        "no-restricted-imports": "error",
        "no-restricted-properties": "error",
        "no-restricted-syntax": "error",
        "no-return-assign": "error",
        "no-return-await": "off",
        "no-script-url": "error",
        "no-self-compare": "error",
        "no-sequences": "off",
        "no-shadow": "off",
        "no-tabs": "off",
        "no-template-curly-in-string": "error",
        "no-ternary": "off",
        "no-throw-literal": "error",
        "no-trailing-spaces": "off",
        "no-undef-init": "error",
        "no-undefined": "off",
        "no-underscore-dangle": "off",
        "no-unmodified-loop-condition": "error",
        "no-unneeded-ternary": "off",
        "no-unreachable-loop": "error",
        "no-unsafe-optional-chaining": "error",
        "no-unused-expressions": "off",
        "no-use-before-define": "off",
        "no-useless-backreference": "error",
        "no-useless-call": "error",
        "no-useless-computed-key": "off",
        "no-useless-concat": "error",
        "no-useless-constructor": "error",
        "no-useless-rename": "error",
        "no-useless-return": "off",
        "no-var": "off",
        "no-void": "error",
        "no-warning-comments": [
            "error",
            {
                "location": "start"
            }
        ],
        "no-whitespace-before-property": "error",
        "nonblock-statement-body-position": [
            "error",
            "any"
        ],
        "object-curly-newline": "off",
        "object-curly-spacing": "off",
        "object-shorthand": "off",
        "one-var": "off",
        "one-var-declaration-per-line": "off",
        "operator-assignment": [
            "error",
            "always"
        ],
        "operator-linebreak": [
            "error",
            null
        ],
        "padded-blocks": "off",
        "padding-line-between-statements": "error",
        "prefer-arrow-callback": "off",
        "prefer-const": "off",
        "prefer-destructuring": "off",
        "prefer-exponentiation-operator": "error",
        "prefer-named-capture-group": "off",
        "prefer-numeric-literals": "error",
        "prefer-object-spread": "error",
        "prefer-promise-reject-errors": "off",
        "prefer-regex-literals": "error",
        "prefer-rest-params": "error",
        "prefer-spread": "error",
        "prefer-template": "off",
        "quote-props": "off",
        "quotes": "off",
        "radix": [
            "error",
            "as-needed"
        ],
        "require-atomic-updates": "off",
        "require-await": "off",
        "require-unicode-regexp": "off",
        "rest-spread-spacing": [
            "error",
            "never"
        ],
        "semi": "off",
        "semi-spacing": [
            "error",
            {
                "after": true,
                "before": false
            }
        ],
        "semi-style": [
            "error",
            "last"
        ],
        "sort-keys": "off",
        "sort-vars": "off",
        "space-before-blocks": "off",
        "space-before-function-paren": "off",
        "space-in-parens": "off",
        "space-infix-ops": "error",
        "space-unary-ops": "off",
        "spaced-comment": "off",
        "strict": "off",
        "switch-colon-spacing": [
            "error",
            {
                "after": true,
                "before": false
            }
        ],
        "symbol-description": "error",
        "template-curly-spacing": [
            "error",
            "never"
        ],
        "template-tag-spacing": "error",
        "unicode-bom": [
            "error",
            "never"
        ],
        "valid-typeof": [
            "error",
            {
                "requireStringLiterals": false
            }
        ],
        "vars-on-top": "off",
        "wrap-iife": "error",
        "wrap-regex": "off",
        "yield-star-spacing": "error",
        "yoda": [
            "error",
            "never"
        ]
    }
};