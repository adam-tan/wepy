const path = require('path');
const fs = require('fs');

const DEFAULT_OPTIONS = {
  entry: { type: String, default: 'app' },
  src: { type: String, default: 'src' },
  target: { type: String, default: 'weapp' },
  static: { type: [String, Array], default: 'static' },
  output: { type: String, default: 'weapp' },
  platform: { type: String },
  wpyExt: { type: String, default: '.wpy' },
  eslint: { type: Boolean, default: true },
  cliLogs: { type: Boolean, default: false },
  watch: { type: Boolean, default: false },
  watchOption: { type: Object },
  noCache: { type: Boolean, default: false },
  'build.web': { type: Object },
  'build.web.htmlTemplate': { type: String },
  'build.web.htmlOutput': { type: String },
  'build.web.jsOutput': { type: String },
  'build.web.resolve': { type: Object, link: 'resolve' },
  resolve: { type: Object, default: {} },
  compilers: { type: Object },
  plugins: { type: Array, default: [] },
  appConfig: { type: Object },
  'appConfig.noPromiseAPI': { type: Array, default: [] }
};

const DEFAULT_CONFIG = path.resolve('wepy.config.js');

/**
 * @description: 设置对象里面的值，这里建议可以用es6优化
 * @param {*} obj 
 * @param {*} key 支持'a.b.c'的形式，表示寻找{a:{b:{c: val}}}的c
 * @param {*} val 更新的val
 * @return {*} obj
 */
function setValue(obj, key, val) {
  let arr = key.split('.');
  let left = obj;
  for (let i = 0, l = arr.length; i < l; i++) {
    if (i === l - 1) {
      left[arr[i]] = val;
    } else {
      if (typeof left[arr[i]] !== 'object') {
        left[arr[i]] = {};
      }
      left = left[arr[i]];
    }
  }
  return obj;
}

/**
 * @description: 获取对象里面的值
 * @param {*} obj
 * @param {*} key
 * @return {*}
 */
function getValue(obj, key) {
  let arr = key.split('.');
  let left = obj;
  let rst;
  for (let i = 0, l = arr.length; i < l; i++) {
    if (i === l - 1) {
      rst = left[arr[i]];
    } else {
      if (typeof left[arr[i]] === 'undefined') {
        break;
      }
      left = left[arr[i]];
    }
  }
  return rst;
}

/**
 * @description: 类型判断
 * @param {*} t
 * @param {*} val
 * @return {*}
 */
function check(t, val) {
  if (Array.isArray(t)) {
    return t.some(type => check(type, val));
  }
  switch (t) {
    case String:
      return typeof val === 'string';
    case Number:
      return typeof val === 'number';
    case Boolean:
      return typeof val === 'boolean';
    case Function:
      return typeof val === 'function';
    case Object:
      return typeof val === 'object';
    case Array:
      return toString.call(val) === '[object Array]';
    default:
      return val instanceof t;
  }
}

/**
 * @description: 解析配置，根据默认配置解析，返回对象 ：
 * 1. 如果相关配置没有设，且默认配置有，且不是命令行配置，则添加默认配置到返回对象
 * 2. 如果配置有设，根据默认配置做类型校验
 *  1. 不符合，报错
 *  2. 符合，加入返回对象
 * @param {*} opt
 * @param {*} baseOpt
 * @param {*} fromCommandLine
 * @return {*} ret 
 */
function parse(opt = {}, baseOpt = DEFAULT_OPTIONS, fromCommandLine) {
  let ret = {};

  for (let k in baseOpt) {
    let defaultItem = baseOpt[k];
    let val = getValue(opt, k);

    if (val === undefined) {
      if (defaultItem.default !== undefined && !fromCommandLine) {
        setValue(ret, k, defaultItem.default);
      }
    } else {
      if (!check(defaultItem.type, val)) {
        throw new Error(`Unexpected type: ${k} expect a ${defaultItem.type.name}`);
      }
      setValue(ret, k, val);
    }
  }
  return ret;
}

function convert(args) {
  if (!fs.existsSync(DEFAULT_CONFIG)) {
    throw new Error(`No configuration file found in the current directory.`);
  }

  let opt = require(DEFAULT_CONFIG);
  let argOpt = parse(args, DEFAULT_OPTIONS, true);

  return Object.assign({}, parse(opt), argOpt);
}

exports = module.exports = {
  setValue: setValue,
  getValue: getValue,
  parse: parse,
  convert: convert
};
