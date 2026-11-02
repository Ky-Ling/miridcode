// Rules oxlint has no native equivalent for. See "Code structure" in CLAUDE.md.
const UTILS_PATH = '@/lib/utils'

const TYPEOF_HELPERS = {
  boolean: 'isBoolean',
  function: 'isFunction',
  number: 'isNumber',
  string: 'isString',
  symbol: 'isSymbol',
  undefined: 'isUndefined',
}

// How each `.length` comparison reads: true means "is not empty".
const LENGTH_TESTS = {
  '=== 0': false,
  '== 0': false,
  '<= 0': false,
  '< 1': false,
  '!== 0': true,
  '!= 0': true,
  '> 0': true,
  '>= 1': true,
}

const FLIPPED_OPERATORS = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' }

const CONTROL_FLOW_KEYWORDS = {
  DoWhileStatement: 'do',
  ForInStatement: 'for',
  ForOfStatement: 'for',
  ForStatement: 'for',
  IfStatement: 'if',
  SwitchStatement: 'switch',
  TryStatement: 'try',
  WhileStatement: 'while',
}

const isNullLiteral = (node) => node.type === 'Literal' && node.raw === 'null'
const isUndefinedIdentifier = (node) => node.type === 'Identifier' && node.name === 'undefined'
const isNullish = (node) => isNullLiteral(node) || isUndefinedIdentifier(node)
const isEquality = (node) => ['==', '===', '!=', '!=='].includes(node?.operator)
const isTypeof = (node) => node.type === 'UnaryExpression' && node.operator === 'typeof'
const isNot = (node) => node.type === 'UnaryExpression' && node.operator === '!'
const isStringLiteral = (node) => node.type === 'Literal' && typeof node.value === 'string'

const isLength = (node) =>
  node.type === 'MemberExpression' && !node.computed && node.property.name === 'length'

const lengthTest = (node) => {
  const flipped = isLength(node.right)
  const member = flipped ? node.right : node.left
  const value = flipped ? node.left : node.right
  if (!isLength(member) || value.type !== 'Literal') return null

  const operator = flipped ? (FLIPPED_OPERATORS[node.operator] ?? node.operator) : node.operator
  const negate = LENGTH_TESTS[`${operator} ${value.value}`]

  return negate === undefined ? null : { operand: member.object, negate }
}

// Boolean, (v) => v, (v) => !!v, and (v) => Boolean(v) all keep only truthy items.
const isTruthyPredicate = (node) => {
  if (node?.name === 'Boolean') return true
  if (node?.type !== 'ArrowFunctionExpression' || node.params[0]?.type !== 'Identifier') {
    return false
  }

  const { body } = node
  const isParam = (value) => value?.type === 'Identifier' && value.name === node.params[0].name

  return (
    isParam(body) ||
    (isNot(body) && isNot(body.argument) && isParam(body.argument.argument)) ||
    (body.type === 'CallExpression' && body.callee.name === 'Boolean' && isParam(body.arguments[0]))
  )
}

const nullishHelper = (node, nullish) => {
  if (node.operator.length === 2) return 'isNil'

  return isNullLiteral(nullish) ? 'isNull' : 'isUndefined'
}

const typeofParts = (node) => {
  if (!isEquality(node)) return null
  if (isTypeof(node.left) && isStringLiteral(node.right)) {
    return { operand: node.left.argument, type: node.right.value }
  }
  if (isTypeof(node.right) && isStringLiteral(node.left)) {
    return { operand: node.right.argument, type: node.left.value }
  }

  return null
}

const blockBody = (parent) => {
  if (parent.type === 'Program' || parent.type === 'BlockStatement') return parent.body
  if (parent.type === 'SwitchCase') return parent.consequent

  return null
}

// A comment may sit between the blank line and the statement it belongs to.
const requireBlankLineBefore = (context, node, keyword) => {
  const { sourceCode } = context
  const body = blockBody(node.parent)
  const previous = body?.[body.indexOf(node) - 1]
  if (!previous) return

  const between = sourceCode.lines.slice(previous.loc.end.line, node.loc.start.line - 1)
  if (between.some((line) => line.trim() === '')) return

  context.report({
    node,
    message: `Add a blank line before \`${keyword}\`.`,
    fix(fixer) {
      const offset = sourceCode.getIndexFromLoc({
        line: previous.loc.end.line + 1,
        column: 0,
      })

      return fixer.insertTextBeforeRange([offset, offset], '\n')
    },
  })
}

const utilsSpecifiers = (program) => {
  const existing = program.body.find(
    (node) =>
      node.type === 'ImportDeclaration' &&
      node.source.value === UTILS_PATH &&
      node.importKind !== 'type',
  )

  return existing?.specifiers.filter((node) => node.type === 'ImportSpecifier') ?? []
}

const importFix = (fixer, program, named, missing) => {
  const names = missing.join(', ')
  if (named.length > 0) return fixer.insertTextAfter(named.at(-1), `, ${names}`)

  const [first] = program.body
  const gap = first.type === 'ImportDeclaration' ? '\n' : '\n\n'

  return fixer.insertTextBefore(first, `import { ${names} } from '${UTILS_PATH}'${gap}`)
}

const blankLineBeforeReturn = {
  meta: { type: 'layout', fixable: 'whitespace' },
  create(context) {
    return {
      ReturnStatement: (node) => requireBlankLineBefore(context, node, 'return'),
    }
  },
}

const blankLineBeforeControlFlow = {
  meta: { type: 'layout', fixable: 'whitespace' },
  create(context) {
    const visitors = Object.entries(CONTROL_FLOW_KEYWORDS).map(([type, keyword]) => [
      type,
      (node) => requireBlankLineBefore(context, node, keyword),
    ])

    return Object.fromEntries(visitors)
  },
}

const preferEsToolkit = {
  meta: { type: 'suggestion', fixable: 'code' },
  create(context) {
    const { sourceCode } = context
    const found = []

    const add = (node, helper, operand, negate = false) =>
      found.push({
        node,
        helper,
        text: `${negate ? '!' : ''}${helper}(${sourceCode.getText(operand)})`,
      })

    const addManual = (node, helper) => found.push({ node, helper })

    return {
      BinaryExpression(node) {
        const length = lengthTest(node)
        if (length) {
          add(node, 'isEmpty', length.operand, length.negate)

          return
        }

        if (!isEquality(node)) return

        const negate = node.operator.startsWith('!')
        const parts = typeofParts(node)

        if (parts) {
          const helper = TYPEOF_HELPERS[parts.type]
          if (helper) add(node, helper, parts.operand, negate)
        } else if (isNullish(node.right)) {
          add(node, nullishHelper(node, node.right), node.left, negate)
        } else if (isNullish(node.left)) {
          add(node, nullishHelper(node, node.left), node.right, negate)
        }
      },
      UnaryExpression(node) {
        if (isNot(node) && isLength(node.argument)) {
          add(node, 'isEmpty', node.argument.object)

          return
        }

        if (!isTypeof(node)) return

        const parts = typeofParts(node.parent)
        if (!parts || !TYPEOF_HELPERS[parts.type]) {
          addManual(node, 'isString / isNumber / isBoolean / isFunction')
        }
      },
      CallExpression(node) {
        const { callee, arguments: args } = node
        if (callee.type !== 'MemberExpression') return

        if (callee.object.name === 'Array' && callee.property.name === 'isArray') {
          add(node, 'isArray', args[0])
        } else if (callee.property.name === 'filter' && isTruthyPredicate(args[0])) {
          add(node, 'compact', callee.object)
        }
      },
      // The import is its own report: one fix per spot lets a single save apply them all.
      'Program:exit'(program) {
        const helpers = new Set(found.filter(({ text }) => text).map(({ helper }) => helper))
        const named = utilsSpecifiers(program)
        const imported = named.map((node) => node.imported.name)
        const missing = [...helpers].filter((helper) => !imported.includes(helper))

        if (missing.length > 0) {
          const { start } = program.body[0].loc

          context.report({
            loc: { start, end: start },
            message: `Import ${missing.join(', ')} from "${UTILS_PATH}".`,
            fix: (fixer) => importFix(fixer, program, named, missing),
          })
        }

        for (const { node, helper, text } of found) {
          context.report({
            node,
            message: `Use ${helper} from "${UTILS_PATH}" (es-toolkit).`,
            fix: text ? (fixer) => fixer.replaceText(node, text) : null,
          })
        }
      },
    }
  },
}

const arrowFunction = {
  meta: { type: 'suggestion', fixable: 'code' },
  create(context) {
    const { sourceCode } = context
    const isTsx = context.filename.endsWith('.tsx')

    const mustBeArrow = (name = '') => /^use[A-Z]/.test(name) || (isTsx && /^[A-Z]/.test(name))

    // `<T>` before `(` reads as JSX in .tsx, and arrows have no this or arguments of their own.
    const isConvertible = (node) =>
      !node.generator &&
      !(isTsx && node.typeParameters) &&
      !/\b(this|arguments)\b/.test(sourceCode.getText(node.body))

    // A const can't be used before its line, unlike a hoisted function.
    const canConvertDeclaration = (node) =>
      isConvertible(node) &&
      node.parent.type !== 'ExportDefaultDeclaration' &&
      !new RegExp(`\\b${node.id.name}\\b`).test(sourceCode.text.slice(0, node.range[0]))

    // A body that only returns becomes an implicit return in the same fix.
    const returnedValue = ({ body }) => {
      const [only, ...rest] = body.body
      const hasComments = sourceCode.getCommentsInside(body).length > 0
      if (only?.type !== 'ReturnStatement' || !only.argument || rest.length > 0 || hasComments) {
        return null
      }

      return sourceCode.getText(only.argument)
    }

    const bodyFix = (fixer, node) => {
      const value = returnedValue(node)

      return value
        ? fixer.replaceText(node.body, `=> (${value})`)
        : fixer.insertTextBefore(node.body, '=> ')
    }

    const message = 'Write components and hooks as arrow functions.'

    return {
      FunctionDeclaration(node) {
        if (!mustBeArrow(node.id?.name)) return

        context.report({
          node: node.id,
          message,
          fix: canConvertDeclaration(node)
            ? (fixer) => [
                fixer.replaceTextRange(
                  [node.range[0], node.id.range[1]],
                  `const ${node.id.name} = ${node.async ? 'async ' : ''}`,
                ),
                bodyFix(fixer, node),
              ]
            : null,
        })
      },
      VariableDeclarator(node) {
        const { id, init } = node
        if (init?.type !== 'FunctionExpression' || !mustBeArrow(id.name)) return

        const paramsStart =
          init.typeParameters?.range[0] ??
          sourceCode.text.indexOf('(', init.id?.range[1] ?? init.range[0])

        context.report({
          node: id,
          message,
          fix: isConvertible(init)
            ? (fixer) => [
                fixer.replaceTextRange([init.range[0], paramsStart], init.async ? 'async ' : ''),
                bodyFix(fixer, init),
              ]
            : null,
        })
      },
    }
  },
}

export default {
  meta: { name: 'miridcode' },
  rules: {
    'arrow-function': arrowFunction,
    'blank-line-before-control-flow': blankLineBeforeControlFlow,
    'blank-line-before-return': blankLineBeforeReturn,
    'prefer-es-toolkit': preferEsToolkit,
  },
}
