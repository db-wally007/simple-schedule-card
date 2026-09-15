/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const be = globalThis, Pe = be.ShadowRoot && (be.ShadyCSS === void 0 || be.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Le = Symbol(), Be = /* @__PURE__ */ new WeakMap();
let $t = class {
  constructor(t, i, s) {
    if (this._$cssResult$ = !0, s !== Le) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = i;
  }
  get styleSheet() {
    let t = this.o;
    const i = this.t;
    if (Pe && t === void 0) {
      const s = i !== void 0 && i.length === 1;
      s && (t = Be.get(i)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), s && Be.set(i, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const Ht = (e) => new $t(typeof e == "string" ? e : e + "", void 0, Le), Ut = (e, ...t) => {
  const i = e.length === 1 ? e[0] : t.reduce((s, n, a) => s + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(n) + e[a + 1], e[0]);
  return new $t(i, e, Le);
}, Yt = (e, t) => {
  if (Pe) e.adoptedStyleSheets = t.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of t) {
    const s = document.createElement("style"), n = be.litNonce;
    n !== void 0 && s.setAttribute("nonce", n), s.textContent = i.cssText, e.appendChild(s);
  }
}, qe = Pe ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let i = "";
  for (const s of t.cssRules) i += s.cssText;
  return Ht(i);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Bt, defineProperty: qt, getOwnPropertyDescriptor: jt, getOwnPropertyNames: Gt, getOwnPropertySymbols: Kt, getPrototypeOf: Xt } = Object, ve = globalThis, je = ve.trustedTypes, Vt = je ? je.emptyScript : "", Zt = ve.reactiveElementPolyfillSupport, Z = (e, t) => e, _e = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? Vt : null;
      break;
    case Object:
    case Array:
      e = e == null ? e : JSON.stringify(e);
  }
  return e;
}, fromAttribute(e, t) {
  let i = e;
  switch (t) {
    case Boolean:
      i = e !== null;
      break;
    case Number:
      i = e === null ? null : Number(e);
      break;
    case Object:
    case Array:
      try {
        i = JSON.parse(e);
      } catch {
        i = null;
      }
  }
  return i;
} }, Ne = (e, t) => !Bt(e, t), Ge = { attribute: !0, type: String, converter: _e, reflect: !1, useDefault: !1, hasChanged: Ne };
Symbol.metadata ??= Symbol("metadata"), ve.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let q = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, i = Ge) {
    if (i.state && (i.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((i = Object.create(i)).wrapped = !0), this.elementProperties.set(t, i), !i.noAccessor) {
      const s = Symbol(), n = this.getPropertyDescriptor(t, s, i);
      n !== void 0 && qt(this.prototype, t, n);
    }
  }
  static getPropertyDescriptor(t, i, s) {
    const { get: n, set: a } = jt(this.prototype, t) ?? { get() {
      return this[i];
    }, set(o) {
      this[i] = o;
    } };
    return { get: n, set(o) {
      const h = n?.call(this);
      a?.call(this, o), this.requestUpdate(t, h, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? Ge;
  }
  static _$Ei() {
    if (this.hasOwnProperty(Z("elementProperties"))) return;
    const t = Xt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(Z("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(Z("properties"))) {
      const i = this.properties, s = [...Gt(i), ...Kt(i)];
      for (const n of s) this.createProperty(n, i[n]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const i = litPropertyMetadata.get(t);
      if (i !== void 0) for (const [s, n] of i) this.elementProperties.set(s, n);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [i, s] of this.elementProperties) {
      const n = this._$Eu(i, s);
      n !== void 0 && this._$Eh.set(n, i);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const i = [];
    if (Array.isArray(t)) {
      const s = new Set(t.flat(1 / 0).reverse());
      for (const n of s) i.unshift(qe(n));
    } else t !== void 0 && i.push(qe(t));
    return i;
  }
  static _$Eu(t, i) {
    const s = i.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
  }
  addController(t) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t), this.renderRoot !== void 0 && this.isConnected && t.hostConnected?.();
  }
  removeController(t) {
    this._$EO?.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), i = this.constructor.elementProperties;
    for (const s of i.keys()) this.hasOwnProperty(s) && (t.set(s, this[s]), delete this[s]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Yt(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, i, s) {
    this._$AK(t, s);
  }
  _$ET(t, i) {
    const s = this.constructor.elementProperties.get(t), n = this.constructor._$Eu(t, s);
    if (n !== void 0 && s.reflect === !0) {
      const a = (s.converter?.toAttribute !== void 0 ? s.converter : _e).toAttribute(i, s.type);
      this._$Em = t, a == null ? this.removeAttribute(n) : this.setAttribute(n, a), this._$Em = null;
    }
  }
  _$AK(t, i) {
    const s = this.constructor, n = s._$Eh.get(t);
    if (n !== void 0 && this._$Em !== n) {
      const a = s.getPropertyOptions(n), o = typeof a.converter == "function" ? { fromAttribute: a.converter } : a.converter?.fromAttribute !== void 0 ? a.converter : _e;
      this._$Em = n;
      const h = o.fromAttribute(i, a.type);
      this[n] = h ?? this._$Ej?.get(n) ?? h, this._$Em = null;
    }
  }
  requestUpdate(t, i, s, n = !1, a) {
    if (t !== void 0) {
      const o = this.constructor;
      if (n === !1 && (a = this[t]), s ??= o.getPropertyOptions(t), !((s.hasChanged ?? Ne)(a, i) || s.useDefault && s.reflect && a === this._$Ej?.get(t) && !this.hasAttribute(o._$Eu(t, s)))) return;
      this.C(t, i, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, i, { useDefault: s, reflect: n, wrapped: a }, o) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, o ?? i ?? this[t]), a !== !0 || o !== void 0) || (this._$AL.has(t) || (this.hasUpdated || s || (i = void 0), this._$AL.set(t, i)), n === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (i) {
      Promise.reject(i);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [n, a] of this._$Ep) this[n] = a;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [n, a] of s) {
        const { wrapped: o } = a, h = this[n];
        o !== !0 || this._$AL.has(n) || h === void 0 || this.C(n, void 0, a, h);
      }
    }
    let t = !1;
    const i = this._$AL;
    try {
      t = this.shouldUpdate(i), t ? (this.willUpdate(i), this._$EO?.forEach((s) => s.hostUpdate?.()), this.update(i)) : this._$EM();
    } catch (s) {
      throw t = !1, this._$EM(), s;
    }
    t && this._$AE(i);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((i) => i.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq &&= this._$Eq.forEach((i) => this._$ET(i, this[i])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
q.elementStyles = [], q.shadowRootOptions = { mode: "open" }, q[Z("elementProperties")] = /* @__PURE__ */ new Map(), q[Z("finalized")] = /* @__PURE__ */ new Map(), Zt?.({ ReactiveElement: q }), (ve.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ie = globalThis, Ke = (e) => e, ye = Ie.trustedTypes, Xe = ye ? ye.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, Tt = "$lit$", C = `lit$${Math.random().toFixed(9).slice(2)}$`, Mt = "?" + C, Qt = `<${Mt}>`, W = document, J = () => W.createComment(""), ee = (e) => e === null || typeof e != "object" && typeof e != "function", Re = Array.isArray, Jt = (e) => Re(e) || typeof e?.[Symbol.iterator] == "function", ke = `[ 	
\f\r]`, X = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ve = /-->/g, Ze = />/g, L = RegExp(`>|${ke}(?:([^\\s"'>=/]+)(${ke}*=${ke}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Qe = /'/g, Je = /"/g, Dt = /^(?:script|style|textarea|title)$/i, ei = (e) => (t, ...i) => ({ _$litType$: e, strings: t, values: i }), d = ei(1), G = Symbol.for("lit-noChange"), f = Symbol.for("lit-nothing"), et = /* @__PURE__ */ new WeakMap(), z = W.createTreeWalker(W, 129);
function Et(e, t) {
  if (!Re(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Xe !== void 0 ? Xe.createHTML(t) : t;
}
const ti = (e, t) => {
  const i = e.length - 1, s = [];
  let n, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = X;
  for (let h = 0; h < i; h++) {
    const r = e[h];
    let l, c, p = -1, m = 0;
    for (; m < r.length && (o.lastIndex = m, c = o.exec(r), c !== null); ) m = o.lastIndex, o === X ? c[1] === "!--" ? o = Ve : c[1] !== void 0 ? o = Ze : c[2] !== void 0 ? (Dt.test(c[2]) && (n = RegExp("</" + c[2], "g")), o = L) : c[3] !== void 0 && (o = L) : o === L ? c[0] === ">" ? (o = n ?? X, p = -1) : c[1] === void 0 ? p = -2 : (p = o.lastIndex - c[2].length, l = c[1], o = c[3] === void 0 ? L : c[3] === '"' ? Je : Qe) : o === Je || o === Qe ? o = L : o === Ve || o === Ze ? o = X : (o = L, n = void 0);
    const g = o === L && e[h + 1].startsWith("/>") ? " " : "";
    a += o === X ? r + Qt : p >= 0 ? (s.push(l), r.slice(0, p) + Tt + r.slice(p) + C + g) : r + C + (p === -2 ? h : g);
  }
  return [Et(e, a + (e[i] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), s];
};
class te {
  constructor({ strings: t, _$litType$: i }, s) {
    let n;
    this.parts = [];
    let a = 0, o = 0;
    const h = t.length - 1, r = this.parts, [l, c] = ti(t, i);
    if (this.el = te.createElement(l, s), z.currentNode = this.el.content, i === 2 || i === 3) {
      const p = this.el.content.firstChild;
      p.replaceWith(...p.childNodes);
    }
    for (; (n = z.nextNode()) !== null && r.length < h; ) {
      if (n.nodeType === 1) {
        if (n.hasAttributes()) for (const p of n.getAttributeNames()) if (p.endsWith(Tt)) {
          const m = c[o++], g = n.getAttribute(p).split(C), u = /([.?@])?(.*)/.exec(m);
          r.push({ type: 1, index: a, name: u[2], strings: g, ctor: u[1] === "." ? si : u[1] === "?" ? ni : u[1] === "@" ? ai : xe }), n.removeAttribute(p);
        } else p.startsWith(C) && (r.push({ type: 6, index: a }), n.removeAttribute(p));
        if (Dt.test(n.tagName)) {
          const p = n.textContent.split(C), m = p.length - 1;
          if (m > 0) {
            n.textContent = ye ? ye.emptyScript : "";
            for (let g = 0; g < m; g++) n.append(p[g], J()), z.nextNode(), r.push({ type: 2, index: ++a });
            n.append(p[m], J());
          }
        }
      } else if (n.nodeType === 8) if (n.data === Mt) r.push({ type: 2, index: a });
      else {
        let p = -1;
        for (; (p = n.data.indexOf(C, p + 1)) !== -1; ) r.push({ type: 7, index: a }), p += C.length - 1;
      }
      a++;
    }
  }
  static createElement(t, i) {
    const s = W.createElement("template");
    return s.innerHTML = t, s;
  }
}
function K(e, t, i = e, s) {
  if (t === G) return t;
  let n = s !== void 0 ? i._$Co?.[s] : i._$Cl;
  const a = ee(t) ? void 0 : t._$litDirective$;
  return n?.constructor !== a && (n?._$AO?.(!1), a === void 0 ? n = void 0 : (n = new a(e), n._$AT(e, i, s)), s !== void 0 ? (i._$Co ??= [])[s] = n : i._$Cl = n), n !== void 0 && (t = K(e, n._$AS(e, t.values), n, s)), t;
}
class ii {
  constructor(t, i) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = i;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: i }, parts: s } = this._$AD, n = (t?.creationScope ?? W).importNode(i, !0);
    z.currentNode = n;
    let a = z.nextNode(), o = 0, h = 0, r = s[0];
    for (; r !== void 0; ) {
      if (o === r.index) {
        let l;
        r.type === 2 ? l = new se(a, a.nextSibling, this, t) : r.type === 1 ? l = new r.ctor(a, r.name, r.strings, this, t) : r.type === 6 && (l = new oi(a, this, t)), this._$AV.push(l), r = s[++h];
      }
      o !== r?.index && (a = z.nextNode(), o++);
    }
    return z.currentNode = W, n;
  }
  p(t) {
    let i = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(t, s, i), i += s.strings.length - 2) : s._$AI(t[i])), i++;
  }
}
class se {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, i, s, n) {
    this.type = 2, this._$AH = f, this._$AN = void 0, this._$AA = t, this._$AB = i, this._$AM = s, this.options = n, this._$Cv = n?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const i = this._$AM;
    return i !== void 0 && t?.nodeType === 11 && (t = i.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, i = this) {
    t = K(this, t, i), ee(t) ? t === f || t == null || t === "" ? (this._$AH !== f && this._$AR(), this._$AH = f) : t !== this._$AH && t !== G && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Jt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== f && ee(this._$AH) ? this._$AA.nextSibling.data = t : this.T(W.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: i, _$litType$: s } = t, n = typeof s == "number" ? this._$AC(t) : (s.el === void 0 && (s.el = te.createElement(Et(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === n) this._$AH.p(i);
    else {
      const a = new ii(n, this), o = a.u(this.options);
      a.p(i), this.T(o), this._$AH = a;
    }
  }
  _$AC(t) {
    let i = et.get(t.strings);
    return i === void 0 && et.set(t.strings, i = new te(t)), i;
  }
  k(t) {
    Re(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let s, n = 0;
    for (const a of t) n === i.length ? i.push(s = new se(this.O(J()), this.O(J()), this, this.options)) : s = i[n], s._$AI(a), n++;
    n < i.length && (this._$AR(s && s._$AB.nextSibling, n), i.length = n);
  }
  _$AR(t = this._$AA.nextSibling, i) {
    for (this._$AP?.(!1, !0, i); t !== this._$AB; ) {
      const s = Ke(t).nextSibling;
      Ke(t).remove(), t = s;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class xe {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, i, s, n, a) {
    this.type = 1, this._$AH = f, this._$AN = void 0, this.element = t, this.name = i, this._$AM = n, this.options = a, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = f;
  }
  _$AI(t, i = this, s, n) {
    const a = this.strings;
    let o = !1;
    if (a === void 0) t = K(this, t, i, 0), o = !ee(t) || t !== this._$AH && t !== G, o && (this._$AH = t);
    else {
      const h = t;
      let r, l;
      for (t = a[0], r = 0; r < a.length - 1; r++) l = K(this, h[s + r], i, r), l === G && (l = this._$AH[r]), o ||= !ee(l) || l !== this._$AH[r], l === f ? t = f : t !== f && (t += (l ?? "") + a[r + 1]), this._$AH[r] = l;
    }
    o && !n && this.j(t);
  }
  j(t) {
    t === f ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class si extends xe {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === f ? void 0 : t;
  }
}
class ni extends xe {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== f);
  }
}
class ai extends xe {
  constructor(t, i, s, n, a) {
    super(t, i, s, n, a), this.type = 5;
  }
  _$AI(t, i = this) {
    if ((t = K(this, t, i, 0) ?? f) === G) return;
    const s = this._$AH, n = t === f && s !== f || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, a = t !== f && (s === f || n);
    n && this.element.removeEventListener(this.name, this, s), a && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class oi {
  constructor(t, i, s) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    K(this, t);
  }
}
const ri = Ie.litHtmlPolyfillSupport;
ri?.(te, se), (Ie.litHtmlVersions ??= []).push("3.3.3");
const hi = (e, t, i) => {
  const s = i?.renderBefore ?? t;
  let n = s._$litPart$;
  if (n === void 0) {
    const a = i?.renderBefore ?? null;
    s._$litPart$ = n = new se(t.insertBefore(J(), a), a, void 0, i ?? {});
  }
  return n._$AI(e), n;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ze = globalThis;
class Q extends q {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const i = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = hi(i, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return G;
  }
}
Q._$litElement$ = !0, Q.finalized = !0, ze.litElementHydrateSupport?.({ LitElement: Q });
const li = ze.litElementPolyfillSupport;
li?.({ LitElement: Q });
(ze.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const di = (e) => (t, i) => {
  i !== void 0 ? i.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ci = { attribute: !0, type: String, converter: _e, reflect: !1, hasChanged: Ne }, pi = (e = ci, t, i) => {
  const { kind: s, metadata: n } = i;
  let a = globalThis.litPropertyMetadata.get(n);
  if (a === void 0 && globalThis.litPropertyMetadata.set(n, a = /* @__PURE__ */ new Map()), s === "setter" && ((e = Object.create(e)).wrapped = !0), a.set(i.name, e), s === "accessor") {
    const { name: o } = i;
    return { set(h) {
      const r = t.get.call(this);
      t.set.call(this, h), this.requestUpdate(o, r, e, !0, h);
    }, init(h) {
      return h !== void 0 && this.C(o, void 0, e, h), h;
    } };
  }
  if (s === "setter") {
    const { name: o } = i;
    return function(h) {
      const r = this[o];
      t.call(this, h), this.requestUpdate(o, r, e, !0, h);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function St(e) {
  return (t, i) => typeof i == "object" ? pi(e, t, i) : ((s, n, a) => {
    const o = n.hasOwnProperty(a);
    return n.constructor.createProperty(a, s), o ? Object.getOwnPropertyDescriptor(n, a) : void 0;
  })(e, t, i);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function y(e) {
  return St({ ...e, state: !0, attribute: !1 });
}
function j(e) {
  return new Date(e.getFullYear(), e.getMonth(), e.getDate());
}
function At(e) {
  const t = j(e), i = (t.getDay() + 6) % 7;
  return t.setDate(t.getDate() - i), t;
}
function $e(e, t, i) {
  const s = At(e);
  s.setDate(s.getDate() + t * 7);
  const n = new Date(s);
  n.setDate(n.getDate() + 7);
  const a = [];
  for (let o = 0; o < i; o++) {
    const h = new Date(s);
    h.setDate(h.getDate() + o), a.push(h);
  }
  return { start: s, end: n, days: a };
}
function Te(e, t) {
  const i = new Date(e.getFullYear(), e.getMonth() + t, 1), s = At(i), n = ui(e, t) * 7, a = new Date(s);
  a.setDate(a.getDate() + n);
  const o = [];
  for (let h = 0; h < n; h++) {
    const r = new Date(s);
    r.setDate(r.getDate() + h), o.push(r);
  }
  return { start: s, end: a, days: o };
}
function ui(e, t) {
  const i = e.getFullYear(), s = e.getMonth() + t, a = (new Date(i, s, 1).getDay() + 6) % 7, o = new Date(i, s + 1, 0).getDate();
  return Math.ceil((a + o) / 7);
}
function tt(e, t) {
  return new Date(e.getFullYear(), e.getMonth() + t, 1);
}
function Me(e) {
  return e.getHours() * 60 + e.getMinutes();
}
function it(e) {
  if (!e || e === "auto") return null;
  const t = /^(\d{1,2}):(\d{2})$/.exec(e.trim());
  if (!t) return null;
  const i = Number(t[1]), s = Number(t[2]);
  return i > 24 || s > 59 ? null : i * 60 + s;
}
function mi(e, t, i) {
  const s = it(t), n = it(i);
  if (s !== null && n !== null && n > s)
    return { start: s, end: n };
  let a = 1 / 0, o = -1 / 0;
  for (const l of e) {
    if (l.allDay) continue;
    a = Math.min(a, Me(l.start));
    const c = Me(l.end) === 0 ? 24 * 60 : Me(l.end);
    o = Math.max(o, c);
  }
  (!Number.isFinite(a) || !Number.isFinite(o)) && (a = 8 * 60, o = 16 * 60);
  const h = s !== null ? s : a, r = n !== null ? n : o;
  return r > h ? { start: h, end: r } : { start: h, end: h + 60 };
}
function fi(e, t, i) {
  if (!e || !e.start || !e.end) return null;
  const s = e.all_day === !0 || !e.start.includes("T"), n = st(e.start), a = st(e.end);
  return !n || !a ? null : {
    // recurrence_id is unique per occurrence; uid is not. Index backstops both.
    key: `${t}|${e.recurrence_id ?? e.uid ?? "x"}|${e.start}|${i}`,
    entity: t,
    uid: e.uid ?? void 0,
    recurrenceId: e.recurrence_id ?? void 0,
    rrule: e.rrule ?? void 0,
    summary: (e.summary ?? "").trim() || "(no title)",
    description: e.description ?? void 0,
    location: e.location ?? void 0,
    start: n,
    end: a,
    allDay: s
  };
}
function st(e) {
  const t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(e);
  if (t) return new Date(Number(t[1]), Number(t[2]) - 1, Number(t[3]));
  const i = new Date(e);
  return Number.isNaN(i.getTime()) ? null : i;
}
function gi(e, t) {
  return t.filter((i) => i.getDay() === 0 || i.getDay() === 6).some((i) => O(e, i).length > 0);
}
function O(e, t) {
  const i = j(t).getTime(), s = i + 24 * 60 * 60 * 1e3;
  return e.filter((n) => n.start.getTime() < s && n.end.getTime() > i);
}
class bi {
  constructor(t) {
    this._onChange = t, this._unsubs = [], this._byEntity = /* @__PURE__ */ new Map(), this._failed = /* @__PURE__ */ new Set(), this._key = "", this._syncing = null;
  }
  /** Every calendar's cached events, flattened. */
  get events() {
    const t = [];
    for (const i of this._byEntity.values()) t.push(...i);
    return t;
  }
  /**
   * Fold a window's worth of pushed events into the cache for one entity.
   *
   * Anything cached that overlaps [start, end) is dropped first: the push is the
   * complete truth for that span, so an event it no longer contains is gone.
   */
  _merge(t, i, s, n) {
    const a = s.getTime(), o = n.getTime(), h = (this._byEntity.get(t) ?? []).filter(
      (r) => r.start.getTime() >= o || r.end.getTime() <= a
    );
    this._byEntity.set(t, [...h, ...i]);
  }
  /** Forget everything cached. Used when a refresh must not show stale events. */
  clear() {
    this._byEntity.clear();
  }
  /** Calendars whose last push was an error. */
  get failed() {
    return [...this._failed];
  }
  get subscribed() {
    return this._unsubs.length > 0;
  }
  /**
   * Subscribe to `entityIds` over [start, end). A no-op when already subscribed
   * to exactly that; pass `force` to tear down and rebuild regardless, which is
   * what the refresh button does.
   */
  async sync(t, i, s, n, a = !1) {
    const o = `${i.join(",")}|${s.getTime()}|${n.getTime()}`;
    if (!a && o === this._key && (this.subscribed || this._syncing === o)) return;
    this._key = o, this._syncing = o, this.stop();
    const h = nt(s), r = nt(n);
    try {
      await this._subscribeAll(t, i, o, s, n, h, r);
    } finally {
      this._syncing === o && (this._syncing = null);
    }
  }
  async _subscribeAll(t, i, s, n, a, o, h) {
    for (const r of i)
      try {
        const l = await t.connection.subscribeMessage(
          (c) => {
            this._key === s && (!c || c.events === null ? this._failed.add(r) : (this._failed.delete(r), this._merge(
              r,
              c.events.map((p, m) => fi(p, r, m)).filter((p) => p !== null),
              n,
              a
            )), this._onChange());
          },
          {
            type: "calendar/event/subscribe",
            entity_id: r,
            start: o,
            end: h
          }
        );
        if (this._key !== s) {
          l();
          return;
        }
        this._unsubs.push(l);
      } catch {
        this._failed.add(r), this._onChange();
      }
  }
  /**
   * Ask Home Assistant to re-poll the calendars now.
   *
   * Google's coordinator serves reads from a cache it refreshes every 15
   * minutes, so without this a change made in Google can take that long to
   * appear. `homeassistant.update_entity` reaches
   * `CoordinatorEntity.async_update` -> `async_request_refresh()`, whose
   * debouncer is immediate, so the poll starts at once. It RETURNS before the
   * poll finishes; the result arrives through the existing subscriptions.
   */
  async forceUpdate(t, i) {
    if (i.length)
      try {
        await t.callService("homeassistant", "update_entity", {
          entity_id: i
        });
      } catch {
      }
  }
  /**
   * Ask the colour helper to republish, if it is installed.
   *
   * It reads Home Assistant's in-memory event store, so this must run AFTER the
   * calendars have re-polled or it will just republish what was already there.
   * Silently ignored when pyscript or the helper is absent — the helper is
   * optional and the card works without it.
   */
  async refreshColorHelper(t) {
    try {
      await t.callService("pyscript", "simple_schedule_colors_sync", {});
    } catch {
    }
  }
  stop() {
    for (const t of this._unsubs)
      try {
        t();
      } catch {
      }
    this._unsubs = [];
  }
}
function nt(e) {
  const t = (i) => String(i).padStart(2, "0");
  return `${e.getFullYear()}-${t(e.getMonth() + 1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}:${t(e.getSeconds())}`;
}
const at = [
  "#0a84ff",
  "#30d158",
  "#ff9f0a",
  "#bf5af2",
  "#ff375f",
  "#64d2ff",
  "#ffd60a",
  "#5e5ce6"
];
async function _i(e, t) {
  if (!t.length) return {};
  const i = {};
  try {
    const s = await e.callWS({
      type: "config/entity_registry/get_entries",
      entity_ids: t
    });
    for (const [n, a] of Object.entries(s ?? {})) {
      const o = a?.options?.calendar?.color;
      typeof o == "string" && /^#[0-9a-fA-F]{6}$/.test(o) && (i[n] = o);
    }
  } catch {
  }
  return i;
}
function yi(e, t, i) {
  return t[e.entity] ?? at[i % at.length];
}
function wi(e, t) {
  if (!t) return;
  const i = e.trim().toLowerCase();
  for (const [s, n] of Object.entries(t))
    if (s.trim().toLowerCase() === i) return n;
}
const vi = "/local/simple-schedule-card-data/event-colors.json";
async function xi(e) {
  try {
    const t = await fetch(e, { cache: "no-cache" });
    if (!t.ok) return null;
    const i = await t.json();
    return {
      by_uid: i.by_uid ?? {},
      by_recurrence_id: i.by_recurrence_id ?? {}
    };
  } catch {
    return null;
  }
}
function ki(e, t, i) {
  if (e) {
    if (i && e.by_recurrence_id[i]) return e.by_recurrence_id[i];
    if (t && e.by_uid[t]) return e.by_uid[t];
  }
}
function De(e, t, i) {
  const s = (n) => {
    const a = n / 255;
    return a <= 0.03928 ? a / 12.92 : ((a + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * s(e) + 0.7152 * s(t) + 0.0722 * s(i);
}
function ot(e, t) {
  return (Math.max(e, t) + 0.05) / (Math.min(e, t) + 0.05);
}
function Ae(e, t, i = "#ffffff") {
  const s = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(e);
  if (!s || !(t > 1)) return e;
  const n = parseInt(s[1], 16), a = parseInt(s[2], 16), o = parseInt(s[3], 16), h = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(i), r = h ? De(parseInt(h[1], 16), parseInt(h[2], 16), parseInt(h[3], 16)) : 1;
  if (ot(r, De(n, a, o)) >= t) return e;
  let l = 0, c = 1;
  for (let g = 0; g < 24; g++) {
    const u = (l + c) / 2;
    ot(r, De(n * u, a * u, o * u)) >= t ? l = u : c = u;
  }
  const p = l, m = (g) => Math.max(0, Math.min(255, Math.floor(g * p))).toString(16).padStart(2, "0");
  return `#${m(n)}${m(a)}${m(o)}`;
}
function rt(e) {
  const t = [...e].sort(
    (n, a) => n.start.getTime() - a.start.getTime() || a.end.getTime() - n.end.getTime() || n.key.localeCompare(a.key)
  ), i = [], s = /* @__PURE__ */ new Map();
  for (const n of t) {
    let a = i.findIndex((o) => o <= n.start.getTime());
    a === -1 && (a = i.length, i.push(0)), i[a] = n.end.getTime(), s.set(n.key, a);
  }
  return s;
}
function ht(e, t, i) {
  if (t === "packed") {
    const o = e.map((r) => rt(r));
    let h = 1;
    for (const r of o) h = Math.max(h, lt(r) + 1);
    return {
      columns: h,
      days: e.map(
        (r, l) => r.map((c) => ({ ev: c, column: o[l].get(c.key) ?? 0 }))
      )
    };
  }
  const s = e.map((o) => {
    const h = /* @__PURE__ */ new Map();
    for (const l of o) {
      const c = h.get(l.entity);
      c ? c.push(l) : h.set(l.entity, [l]);
    }
    const r = /* @__PURE__ */ new Map();
    for (const l of h.values())
      for (const [c, p] of rt(l)) r.set(c, p);
    return r;
  });
  let n = 1;
  for (const o of s) n = Math.max(n, lt(o) + 1);
  const a = i.length ? i : [""];
  return {
    columns: a.length * n,
    days: e.map(
      (o, h) => o.map((r) => {
        const l = Math.max(0, a.indexOf(r.entity));
        return { ev: r, column: l * n + (s[h].get(r.key) ?? 0) };
      })
    )
  };
}
function lt(e) {
  let t = -1;
  for (const i of e.values()) t = Math.max(t, i);
  return t;
}
const P = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"], ie = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"], Ot = ["MO", "TU", "WE", "TH", "FR"], We = {
  1: "first",
  2: "second",
  3: "third",
  4: "fourth",
  [-1]: "last"
};
function Oe(e) {
  const t = Math.ceil(e.getDate() / 7);
  return t >= 5 ? -1 : t;
}
function Ct(e, t) {
  if (e.length !== t.length) return !1;
  const i = [...e].sort(), s = [...t].sort();
  return i.every((n, a) => n === s[a]);
}
function Fe(e) {
  return [...e].sort((t, i) => ie.indexOf(t) - ie.indexOf(i));
}
function Pt(e, t) {
  const i = P[e.getDay()], s = new Intl.DateTimeFormat(t, { weekday: "long" }).format(e), n = Oe(e), a = new Intl.DateTimeFormat(t, { month: "long", day: "numeric" }).format(e), o = { kind: "never" };
  return [
    { key: "none", label: "Does not repeat", rule: null },
    { key: "daily", label: "Daily", rule: { freq: "DAILY", interval: 1, byDay: [], end: o } },
    {
      key: "weekly",
      label: `Weekly on ${s}`,
      rule: { freq: "WEEKLY", interval: 1, byDay: [i], end: o }
    },
    {
      key: "monthly",
      label: `Monthly on the ${We[n]} ${s}`,
      rule: {
        freq: "MONTHLY",
        interval: 1,
        byDay: [],
        byPos: { pos: n, day: i },
        end: o
      }
    },
    {
      key: "yearly",
      label: `Annually on ${a}`,
      rule: { freq: "YEARLY", interval: 1, byDay: [], end: o }
    },
    {
      key: "weekdays",
      label: "Every weekday (Monday to Friday)",
      rule: { freq: "WEEKLY", interval: 1, byDay: [...Ot], end: o }
    }
  ];
}
function Ce(e) {
  const t = { ...e, byDay: e.freq === "WEEKLY" ? e.byDay : [] };
  return t.freq !== "MONTHLY" && delete t.byPos, t.freq !== "MONTHLY" && t.freq !== "YEARLY" && delete t.byMonthDay, t.freq !== "YEARLY" && delete t.byMonth, t.byPos && delete t.byMonthDay, t;
}
function Lt(e, t) {
  if (!e || !t) return e === t;
  const i = Ce(e), s = Ce(t);
  return i.freq !== s.freq || i.interval !== s.interval || !Ct(i.byDay, s.byDay) || !!i.byPos != !!s.byPos || i.byPos && s.byPos && (i.byPos.pos !== s.byPos.pos || i.byPos.day !== s.byPos.day) || (i.byMonthDay ?? null) !== (s.byMonthDay ?? null) || (i.byMonth ?? null) !== (s.byMonth ?? null) || i.end.kind !== s.end.kind ? !1 : i.end.kind === "on" && s.end.kind === "on" ? i.end.date === s.end.date : i.end.kind === "after" && s.end.kind === "after" ? i.end.count === s.end.count : !0;
}
function $i(e, t, i) {
  const s = Pt(t, i).find((n) => Lt(n.rule, e));
  return s ? s.key : "custom";
}
function Ti(e, t) {
  if (t) return e.replace(/-/g, "");
  const i = /* @__PURE__ */ new Date(`${e}T23:59:59`), s = (n) => String(n).padStart(2, "0");
  return `${i.getUTCFullYear()}${s(i.getUTCMonth() + 1)}${s(i.getUTCDate())}T${s(i.getUTCHours())}${s(i.getUTCMinutes())}${s(i.getUTCSeconds())}Z`;
}
function dt(e, t = !1) {
  const i = Ce(e), s = [`FREQ=${i.freq}`];
  return i.interval > 1 && s.push(`INTERVAL=${i.interval}`), i.freq === "WEEKLY" && i.byDay.length && s.push(`BYDAY=${Fe(i.byDay).join(",")}`), i.freq === "MONTHLY" && i.byPos && s.push(`BYDAY=${i.byPos.pos}${i.byPos.day}`), i.byMonth !== void 0 && s.push(`BYMONTH=${i.byMonth}`), i.byMonthDay !== void 0 && !i.byPos && s.push(`BYMONTHDAY=${i.byMonthDay}`), i.end.kind === "on" && s.push(`UNTIL=${Ti(i.end.date, t)}`), i.end.kind === "after" && s.push(`COUNT=${i.end.count}`), `RRULE:${s.join(";")}`;
}
const Mi = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
function ct(e) {
  if (!e) return null;
  const t = e.split(/[\r\n]+/).map((g) => g.trim()).find((g) => !g || /^(RRULE[:;])/i.test(g) || /FREQ=/i.test(g));
  if (!t) return null;
  const i = t.replace(/^RRULE[:;]/i, ""), s = /* @__PURE__ */ new Map();
  for (const g of i.split(";")) {
    const [u, w] = g.split("=");
    u && w !== void 0 && s.set(u.trim().toUpperCase(), w.trim());
  }
  const n = (s.get("FREQ") ?? "").toUpperCase();
  if (!Mi.includes(n)) return null;
  for (const g of ["BYSETPOS", "BYYEARDAY", "BYWEEKNO", "BYHOUR", "BYMINUTE"])
    if (s.has(g)) return null;
  const a = Number(s.get("INTERVAL") ?? "1");
  if (!Number.isInteger(a) || a < 1) return null;
  const o = { freq: n, interval: a, byDay: [], end: { kind: "never" } }, h = s.get("BYDAY");
  if (h) {
    const g = h.split(",").map((w) => w.trim().toUpperCase()).filter(Boolean), u = g.filter((w) => /^-?\d/.test(w));
    if (u.length) {
      if (n !== "MONTHLY" || g.length !== 1) return null;
      const w = /^(-?\d+)([A-Z]{2})$/.exec(u[0]);
      if (!w) return null;
      const x = Number(w[1]);
      if (!We[x] || !P.includes(w[2])) return null;
      o.byPos = { pos: x, day: w[2] };
    } else {
      if (g.some((w) => !P.includes(w))) return null;
      o.byDay = Fe(g);
    }
  }
  const r = (g) => {
    const u = s.get(g);
    if (u === void 0) return;
    if (u.includes(",")) return null;
    const w = Number(u);
    return Number.isInteger(w) ? w : null;
  }, l = r("BYMONTHDAY");
  if (l === null) return null;
  if (l !== void 0) {
    if (n !== "MONTHLY" && n !== "YEARLY" || l < 1 || l > 31) return null;
    o.byMonthDay = l;
  }
  const c = r("BYMONTH");
  if (c === null) return null;
  if (c !== void 0) {
    if (n !== "YEARLY" || c < 1 || c > 12) return null;
    o.byMonth = c;
  }
  if (o.byPos && o.byMonthDay !== void 0 || s.has("COUNT") && s.has("UNTIL")) return null;
  const p = s.get("COUNT");
  if (p !== void 0) {
    const g = Number(p);
    if (!Number.isInteger(g) || g < 1) return null;
    o.end = { kind: "after", count: g };
  }
  const m = s.get("UNTIL");
  if (m !== void 0) {
    const g = Di(m);
    if (!g) return null;
    o.end = { kind: "on", date: g };
  }
  return o;
}
function Di(e) {
  const t = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z?))?$/.exec(e.trim());
  if (!t) return null;
  const [, i, s, n, a, o, h, r] = t;
  if (!a) return `${i}-${s}-${n}`;
  const l = r ? new Date(Date.UTC(+i, +s - 1, +n, +a, +o, +h)) : new Date(+i, +s - 1, +n, +a, +o, +h);
  if (Number.isNaN(l.getTime())) return null;
  const c = (p) => String(p).padStart(2, "0");
  return `${l.getFullYear()}-${c(l.getMonth() + 1)}-${c(l.getDate())}`;
}
function Ei(e, t) {
  const i = Fe(e).map((s) => {
    const n = ie.indexOf(s);
    return new Intl.DateTimeFormat(t, { weekday: "long" }).format(new Date(2024, 0, 1 + n));
  });
  return i.length < 2 ? i.join("") : `${i.slice(0, -1).join(", ")} and ${i[i.length - 1]}`;
}
function de(e, t, i) {
  if (!e) return "Does not repeat";
  const s = e.interval > 1 ? `Every ${e.interval} ` : "";
  let n;
  switch (e.freq) {
    case "DAILY":
      n = s ? `${s}days` : "Daily";
      break;
    case "WEEKLY": {
      const a = e.byDay.length ? e.byDay : [P[t.getDay()]];
      if (!s && Ct(a, Ot)) {
        n = "Every weekday (Monday to Friday)";
        break;
      }
      const o = `on ${Ei(a, i)}`;
      n = s ? `${s}weeks ${o}` : `Weekly ${o}`;
      break;
    }
    case "MONTHLY": {
      const a = e.byPos ? `on the ${We[e.byPos.pos]} ${new Intl.DateTimeFormat(i, {
        weekday: "long"
      }).format(new Date(2024, 0, 1 + ie.indexOf(e.byPos.day)))}` : `on day ${e.byMonthDay ?? t.getDate()}`;
      n = s ? `${s}months ${a}` : `Monthly ${a}`;
      break;
    }
    default: {
      const a = new Intl.DateTimeFormat(i, {
        month: "long",
        day: "numeric"
      }).format(t);
      n = s ? `${s}years` : `Annually on ${a}`;
      break;
    }
  }
  if (e.end.kind === "on") {
    const a = /* @__PURE__ */ new Date(`${e.end.date}T00:00`), o = Number.isNaN(a.getTime()) ? e.end.date : new Intl.DateTimeFormat(i, {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(a);
    return `${n}, until ${o}`;
  }
  return e.end.kind === "after" ? `${n}, ${e.end.count} time${e.end.count === 1 ? "" : "s"}` : n;
}
const Si = "https://photon.komoot.io/api/", Nt = 3;
function It(e) {
  const t = [e.street, e.housenumber].filter(Boolean).join(" "), i = [e.postcode, e.city].filter(Boolean).join(" "), s = e.name || t || e.city || e.country || "", n = [];
  e.name && t && n.push(t), i && i !== s && n.push(i), e.district && !i.includes(e.district) && e.district !== s && n.push(e.district), e.country && e.country !== s && n.push(e.country);
  const a = n.join(", ");
  return { name: s, detail: a, label: a ? `${s}, ${a}` : s };
}
async function pt(e, t = {}) {
  const i = e.trim();
  if (i.length < Nt) return [];
  const s = new URLSearchParams({ q: i, limit: String(t.limit ?? 6) });
  typeof t.lat == "number" && typeof t.lon == "number" && (s.set("lat", String(t.lat)), s.set("lon", String(t.lon))), t.lang && s.set("lang", t.lang);
  try {
    const n = await fetch(`${Si}?${s.toString()}`, { signal: t.signal });
    if (!n.ok) return [];
    const a = await n.json(), o = [];
    for (const h of a.features ?? []) {
      const r = h.geometry?.coordinates;
      if (!r || r.length < 2) continue;
      const { name: l, detail: c, label: p } = It(h.properties ?? {});
      p && o.push({ label: p, name: l, detail: c, lat: r[1], lon: r[0] });
    }
    return o;
  } catch {
    return [];
  }
}
const I = 256;
function Ai(e, t, i) {
  const s = I * 2 ** i, n = (t + 180) / 360 * s, o = Math.max(-85.05112878, Math.min(85.05112878, e)) * Math.PI / 180, h = (1 - Math.log(Math.tan(o) + 1 / Math.cos(o)) / Math.PI) / 2 * s;
  return { x: n, y: h };
}
function Oi(e, t, i, s, n, a = "Dark") {
  const o = Ai(e, t, i), h = o.x - s / 2, r = o.y - n / 2, l = 2 ** i, c = [], p = [], m = Math.floor(h / I), g = Math.floor(r / I), u = Math.floor((h + s) / I), w = Math.floor((r + n) / I);
  for (let x = g; x <= w; x++)
    if (!(x < 0 || x >= l))
      for (let E = m; E <= u; E++) {
        const F = (E % l + l) % l, H = E * I - h, M = x * I - r, S = "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas";
        c.push({ url: `${S}/World_${a}_Gray_Base/MapServer/tile/${i}/${x}/${F}`, left: H, top: M }), p.push({
          url: `${S}/World_${a}_Gray_Reference/MapServer/tile/${i}/${x}/${F}`,
          left: H,
          top: M
        });
      }
  return { base: c, labels: p };
}
const ut = {
  street: {
    // World_TOPO_Map, not World_Street_Map. Compared at zoom 18 over a Czech
    // village, Street draws ONE ROAD LINE and nothing else — no buildings, no
    // street names — while Topo draws the buildings and names the streets. Esri's
    // street rendering thins out badly outside cities, which is exactly where a
    // child's after-school club is.
    //
    // NOT tile.openstreetmap.org either: their policy forbids third-party apps
    // and their servers enforce it with 403 "Access blocked", rendered as a
    // yellow hazard-striped tile. A browser cannot send an identifying
    // User-Agent, so there is no compliant way to use them.
    url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    maxNativeZoom: 19,
    attribution: "© Esri"
  }
}, Ci = "/static/images/leaflet/leaflet.css";
let ce = null;
function Pi() {
  return ce || (ce = (async () => {
    const e = window;
    if (e.L) return e.L;
    if (!e.loadCardHelpers) return null;
    try {
      const i = await (await e.loadCardHelpers()).createCardElement({ type: "map", entities: [] });
      i.style.cssText = "position:absolute;left:-9999px;top:0;width:1px;height:1px;visibility:hidden", document.body.appendChild(i);
      for (let s = 0; s < 60 && !e.L; s++)
        await new Promise((n) => setTimeout(n, 50));
      return i.remove(), e.L ?? null;
    } catch {
      return null;
    }
  })(), ce);
}
async function Li(e, t, i = {}) {
  const s = new URLSearchParams({ lat: String(e), lon: String(t) });
  i.lang && s.set("lang", i.lang);
  try {
    const n = await fetch(`https://photon.komoot.io/reverse?${s.toString()}`, {
      signal: i.signal
    });
    if (!n.ok) return null;
    const o = (await n.json()).features?.[0];
    if (!o) return null;
    const { name: h, detail: r, label: l } = It(o.properties ?? {});
    if (!l) return null;
    const c = o.geometry?.coordinates;
    return {
      label: l,
      name: h,
      detail: r,
      lat: c?.[1] ?? e,
      lon: c?.[0] ?? t
    };
  } catch {
    return null;
  }
}
function Ni(e, t, i) {
  return typeof t == "number" && typeof i == "number" ? `https://www.google.com/maps/search/?api=1&query=${t},${i}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e)}`;
}
var Ii = Object.defineProperty, Ri = Object.getOwnPropertyDescriptor, _ = (e, t, i, s) => {
  for (var n = s > 1 ? void 0 : s ? Ri(t, i) : t, a = e.length - 1, o; a >= 0; a--)
    (o = e[a]) && (n = (s ? o(t, i, n) : o(n)) || n);
  return s && n && Ii(t, i, n), n;
};
const zi = "3.1.0", $ = {
  days: "auto",
  day_start: "07:00",
  day_end: "15:00",
  orientation: "days-as-columns",
  hour_height: 84,
  day_height: 72,
  // 192px/hour puts a 45-minute block at 144px, ~126px of text inside, which is
  // about 16 characters at the block's 15px/600 face (measured, not guessed).
  // Wider than the screen for a normal school day, hence the scroller.
  hour_width: 192,
  lane_mode: "by_source",
  time_format: "auto",
  min_contrast: 4.5,
  show_refresh: !0,
  show_mode_toggles: !0,
  mode_toggle_icons: "crop",
  animations: "auto",
  layout: "auto",
  layout_breakpoint: 560,
  month_mode_show_times: !0
}, mt = 22, Wi = 28, Fi = 12, pe = 55, Hi = 22, Ui = 520, Yi = 8, Bi = 4.345, qi = 52.18, ji = 230, Gi = "cubic-bezier(0.4, 0, 1, 1)", ft = 16, Ki = 0.985, ue = [
  ["1", "#a4bdfc", "Lavender"],
  ["2", "#7ae7bf", "Sage"],
  ["3", "#dbadff", "Grape"],
  ["4", "#ff887c", "Flamingo"],
  ["5", "#fbd75b", "Banana"],
  ["6", "#ffb878", "Tangerine"],
  ["7", "#46d6db", "Peacock"],
  ["8", "#e1e1e1", "Graphite"],
  ["9", "#5484ed", "Blueberry"],
  ["10", "#51b749", "Basil"],
  ["11", "#dc2127", "Tomato"]
], V = 44, Xi = 5;
function R(e) {
  const t = (i) => String(i).padStart(2, "0");
  return {
    date: `${e.getFullYear()}-${t(e.getMonth() + 1)}-${t(e.getDate())}`,
    time: `${t(e.getHours())}:${t(e.getMinutes())}`
  };
}
function Vi(e) {
  const t = /* @__PURE__ */ new Date(`${e}T00:00`);
  return t.setDate(t.getDate() + 1), R(t).date;
}
const gt = 520, bt = 10, we = 15, Ee = 30, Zi = {
  1: "first",
  2: "second",
  3: "third",
  4: "fourth",
  [-1]: "last"
}, Qi = 220, Ji = 4, es = 2, Rt = 62, ts = 104, is = "#ededed", ss = 3, ns = 18, _t = 12, yt = 1, Se = 3, zt = 8, Wt = 8, wt = zt + Wt, as = 33, os = 18, vt = 268, A = 8;
function rs(e) {
  return Math.max(0, Math.floor(e / we) * we);
}
function me(e) {
  return { axis: "y", start: e, span: 0, kind: "label", ghost: () => "" };
}
const hs = 64, ls = 20, ds = 172, cs = 18, fe = {
  crop: {
    monthly: "mdi:calendar-month",
    focused: "mdi:crop",
    full: "mdi:crop-free",
    fixed: "mdi:pan-horizontal",
    adaptive: "mdi:fit-to-screen-outline"
  },
  timeline: {
    monthly: "mdi:calendar-month",
    focused: "mdi:timeline-clock-outline",
    full: "mdi:timeline-outline",
    fixed: "mdi:pan-horizontal",
    adaptive: "mdi:overscan"
  },
  calendar: {
    monthly: "mdi:calendar-month",
    focused: "mdi:calendar-range",
    full: "mdi:calendar-expand-horizontal",
    fixed: "mdi:pan-horizontal",
    adaptive: "mdi:fit-to-screen-outline"
  },
  arrows: {
    monthly: "mdi:calendar-month",
    focused: "mdi:arrow-collapse-horizontal",
    full: "mdi:arrow-expand-horizontal",
    fixed: "mdi:pan-horizontal",
    adaptive: "mdi:fit-to-screen-outline"
  }
}, ps = 600, us = 12e3, ms = 2200, fs = 56, gs = 190, bs = 6e3, _s = 15e3, ys = 700, ws = 120;
let b = class extends Q {
  constructor() {
    super(...arguments), this._sources = [], this._colors = {}, this._eventColors = null, this._weekOffset = 0, this._monthOffset = 0, this._now = /* @__PURE__ */ new Date(), this._hostWidth = 0, this._refreshing = !1, this._navDir = "none", this._activeIdx = 0, this._motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)"), this._onMotionChange = () => {
      this.requestUpdate();
    }, this._navAnims = [], this._staleAnims = [], this._modeOverride = {}, this._pickerOpen = !1, this._animEpoch = 0, this._hThumb = null, this._axisPx = 0, this._editMode = !1, this._menuOpen = !1, this._draft = null, this._scope = "instance", this._busy = !1, this._editError = null, this._confirmDelete = !1, this._dayPeek = null, this._monthGridH = 0, this._monthFit = 3, this._monthTight = !1, this._monthSeen = /* @__PURE__ */ new Set(), this._monthAwaitingAnim = !1, this._monthLaidOut = "", this._press = null, this._pressDid = !1, this._pressFrom = null, this._openPicker = null, this._pickerMonth = null, this._pickerClosing = null, this._pickerOutField = null, this._flipFrom = null, this._calDir = 0, this._calEpoch = 0, this._detailsOpen = !1, this._colorOpen = !1, this._repeatOpen = !1, this._customOpen = !1, this._custom = null, this._customClosing = !1, this._endsOpen = !1, this._places = [], this._placesBusy = !1, this._mapOpen = !1, this._mapPoint = null, this._baseMap = "street", this._baseLayers = [], this._leafletMap = null, this._leafletMarker = null, this._mapPickSeq = 0, this._mapWanted = !1, this._leaflet = null, this._leafletOk = !1, this._flash = 0, this._flashOut = !1, this._wheelsPending = !1, this._revision = 0, this._subs = new bi(() => {
      this._revision++;
    }), this._subWanted = "", this._colorKey = "", this._focusPx = 0, this._focusKey = "", this._focusBusy = !1, this._colorsAt = 0, this._eventColorsAt = 0, this._eventColorsPending = !1, this._onWinResize = () => {
      this._resetMonthSettle(), this._monthLaidOut = "", this._fitDayPeek();
    }, this._onMenuOutside = (e) => {
      const t = this.renderRoot?.querySelector(".tools-menu-wrap");
      t && e.composedPath().includes(t) || this._setMenu(!1);
    }, this._onMenuKey = (e) => {
      e.key === "Escape" && this._setMenu(!1);
    }, this._onPressMove = (e) => {
      const t = this._pressFrom;
      t && (Math.abs(e.clientX - t.x) > bt || Math.abs(e.clientY - t.y) > bt) && this._pressCancel();
    }, this._onPressEnd = () => {
      this._pressCancel();
    }, this._rubberFrom = null, this._rubberAt = 0, this._onOutside = (e) => {
      const t = this.renderRoot?.querySelector(".picker");
      t && e.composedPath().includes(t) || this._setPicker(!1);
    }, this._onPickerKey = (e) => {
      e.key === "Escape" && this._setPicker(!1);
    }, this._barDrag = null, this._wheelTimers = {};
  }
  setConfig(e) {
    if (!e) throw new Error("simple-schedule-card: invalid configuration");
    const t = vs(e);
    if (!t.length)
      throw new Error(
        'simple-schedule-card: "entity" (a calendar entity_id) or "entities" is required'
      );
    for (const i of t)
      if (!i.entity.startsWith("calendar."))
        throw new Error(`simple-schedule-card: "${i.entity}" is not a calendar entity`);
    this._config = { ...e }, this._sources = t, this._colorKey = "";
  }
  getCardSize() {
    return 10;
  }
  getGridOptions() {
    return { columns: "full", rows: 10, min_rows: 6 };
  }
  static getStubConfig() {
    return {
      type: "custom:simple-schedule-card",
      entity: "calendar.school",
      ...$
    };
  }
  connectedCallback() {
    super.connectedCallback(), this._tick = setInterval(() => {
      this._now = /* @__PURE__ */ new Date();
    }, 6e4), this._hostRo = new ResizeObserver((e) => {
      const t = Math.round(e[e.length - 1].contentRect.width);
      t && t !== this._hostWidth && (this._hostWidth = t);
    }), this._hostRo.observe(this), window.addEventListener("resize", this._onWinResize), this._motionQuery.addEventListener("change", this._onMotionChange);
  }
  /**
   * Let the grid height be re-derived from scratch.
   *
   * Called for the things that genuinely change the answer - a different month
   * (a different number of rows), a resize, a different calendar or shape. NOT
   * on a re-render, which is the whole point: between these, a height already
   * tried is evidence of a cycle rather than of progress.
   */
  _resetMonthSettle() {
    this._monthSeen.clear();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._tick && clearInterval(this._tick), this._tick = void 0, this._spinTimer && clearTimeout(this._spinTimer), this._spinTimer = void 0, this._subTimer && clearTimeout(this._subTimer), this._subTimer = void 0, this._hostRo?.disconnect(), this._hostRo = void 0, window.removeEventListener("resize", this._onWinResize), this._motionQuery.removeEventListener("change", this._onMotionChange), this._setPicker(!1), this._setMenu(!1), this._pressCancel(), this._subs.stop();
  }
  updated(e) {
    if (super.updated(e), this._staleAnims.length) {
      for (const t of this._staleAnims) t.cancel();
      this._staleAnims = [];
    }
    this._wheelsPending && (this._wheelsPending = !1, this._positionWheels()), this._animatePicker(), this._flipPlay(), (e.size > 1 || !e.has("hass")) && (this._measureMonth(), this._fitDayPeek()), this._syncLeaflet(), !(!this.hass || !this._config) && (this._orientation === "days-as-rows" && (this._measureScrollbar(), this._focusScroller()), this._ensureSubscribed(), this._ensureColors(), this._ensureEventColors());
  }
  /**
   * The week to draw. The window is ALWAYS the full seven days — that is what is
   * subscribed to — and only the day list is trimmed, so `auto` can look at the
   * weekend before deciding whether to show it.
   */
  get _window() {
    if (this._isMonth) return Te(this._now, this._monthOffset);
    const e = $e(this._now, this._weekOffset, 7), t = this._config?.days ?? $.days;
    let i = 5;
    return (t === "mon-sun" || t === "auto" && gi(this._activeEvents, e.days)) && (i = 7), { start: e.start, end: e.end, days: e.days.slice(0, i) };
  }
  get _entityIds() {
    return this._sources.map((e) => e.entity);
  }
  /** Events of the calendar currently on screen. */
  get _activeEvents() {
    const e = this._sources[Math.min(this._activeIdx, this._sources.length - 1)]?.entity;
    return this._subs.events.filter((t) => t.entity === e);
  }
  /**
   * What is SUBSCRIBED: three weeks — the one on screen and one either side.
   *
   * Stepping a week then re-subscribes to a window that still overlaps most of
   * the last one, and the subscription cache keeps whatever falls outside it, so
   * the week being stepped onto is already drawn before its own push arrives.
   * With a one-week window there was nothing cached for it at all, and clicking
   * through weeks quickly showed a second or two of empty calendar each time.
   *
   * Everything that reasons about ONE week filters by day (eventsForDay) or by
   * range, so the wider window never widens what is drawn.
   */
  get _subWindow() {
    return this._isMonth ? {
      start: Te(this._now, this._monthOffset - 1).start,
      end: Te(this._now, this._monthOffset + 1).end
    } : {
      start: $e(this._now, this._weekOffset - 1, 7).start,
      end: $e(this._now, this._weekOffset + 1, 7).end
    };
  }
  /**
   * Subscribe to the window on screen - but not to every window passed through
   * on the way there.
   *
   * Each subscription asks Home Assistant to expand THREE MONTHS of recurrences
   * for every calendar and push the lot back. Stepping the month ten times in
   * quick succession fired ten rounds of that, nine of them for windows already
   * gone by, and the work is done on the event loop that also serves the
   * websocket - so the frontend stops being fed while the backend grinds through
   * expansions nobody is waiting for any more.
   *
   * So a window CHANGE waits for the paging to settle, and only the window
   * actually landed on is ever asked for. A steady window still calls straight
   * through, where `sync` no-ops unless the subscription is genuinely missing.
   */
  _ensureSubscribed() {
    const e = this._subWindow, t = `${this._entityIds.join(",")}|${e.start.getTime()}|${e.end.getTime()}`;
    if (t !== this._subWanted) {
      this._subWanted = t, this._subTimer && clearTimeout(this._subTimer), this._subTimer = setTimeout(() => {
        this._subTimer = void 0;
        const i = this._subWindow;
        this._subs.sync(this.hass, this._entityIds, i.start, i.end);
      }, Qi);
      return;
    }
    this._subTimer || this._subs.sync(this.hass, this._entityIds, e.start, e.end);
  }
  /**
   * Re-read the calendars' own colours. Refetched on a TTL rather than once,
   * because the `simple_schedule_colors` helper writes this field in the
   * background when a calendar is recoloured in Google — without a TTL the card
   * would show the stale colour until the page was reloaded.
   */
  async _ensureColors(e = !1) {
    const t = this._entityIds.join(","), i = Date.now() - this._colorsAt > 10 * 6e4;
    !e && t === this._colorKey && !i || (this._colorKey = t, this._colorsAt = Date.now(), this._colors = await _i(this.hass, this._entityIds));
  }
  /** The colour of a whole calendar — used by the legend. */
  /**
   * True whenever something is layered in front of the schedule — the calendar
   * menu or an event's detail sheet. Both recede the grid the same way, so the
   * card has one behaviour for "there is something on top of this" rather than
   * two that drift apart.
   */
  /**
   * Is the schedule standing back behind something?
   *
   * The overflow menu counts, exactly as the calendar picker does. Both are
   * menus that open over the week, and only one of them used to push the week
   * away — so opening the other one left the schedule sitting at full strength
   * behind a floating panel, which is the thing that read as "no animation".
   */
  get _receded() {
    return this._pickerOpen || this._menuOpen || !!this._selected || !!this._draft;
  }
  /**
   * Just the sheet — NOT the picker or the tools menu.
   *
   * The header recedes with everything else when a sheet opens, but those two
   * menus live INSIDE the header: dimming it for them would dim the very menu
   * that was just opened.
   */
  get _sheetOpen() {
    return !!this._selected || !!this._draft;
  }
  /** Close the detail sheet, replaying the entry cascade as the menu does. */
  _closeSheet() {
    this._selected && (this._selected = void 0, this._animEpoch++);
  }
  /* ------------------------------------------------------------------ *
   * Editing.
   *
   * Every write goes through pyscript/simple_schedule_edit.py, because Home
   * Assistant itself cannot change a Google event: the integration declares
   * CREATE and DELETE only, so core's calendar/event/update refuses. That
   * file's header has the whole of why.
   * ------------------------------------------------------------------ */
  /**
   * Google's own id for an event, which is what the edit services take.
   *
   * A recurring occurrence has a recurrence_id — `<master>_<utc stamp>` — and
   * that IS the id. A one-off has none, and its id is the uid with Google's
   * suffix taken off. Checked against a real calendar both ways round.
   */
  _googleId(e) {
    return e.recurrenceId ? e.recurrenceId : e.uid ? e.uid.replace(/@google\.com$/i, "") : null;
  }
  _isRecurring(e) {
    return !!e.recurrenceId && e.recurrenceId.includes("_");
  }
  _setMenu(e) {
    e !== this._menuOpen && (this._menuOpen = e, e || this._animEpoch++, e ? (document.addEventListener("pointerdown", this._onMenuOutside, !0), document.addEventListener("keydown", this._onMenuKey, !0)) : (document.removeEventListener("pointerdown", this._onMenuOutside, !0), document.removeEventListener("keydown", this._onMenuKey, !0)));
  }
  _toggleEditMode() {
    this._setMenu(!1), this._editMode = !this._editMode, this._editMode || this._closeEditor(), this._reducedMotion || (this._flashOut = !this._editMode, this._flash++);
  }
  /**
   * The palette id matching an event's current colour, or '' for the default.
   *
   * The colour helper publishes hex, not ids, so this maps back through Google's
   * own palette — which is where the helper got those hexes from, so the match
   * is exact rather than nearest.
   */
  _colorIdFor(e) {
    const t = this._eventColors;
    if (!t) return "";
    const i = (e.recurrenceId ? t.by_recurrence_id?.[e.recurrenceId] : void 0) ?? (e.uid ? t.by_uid?.[e.uid] : void 0);
    if (!i) return "";
    const s = ue.find(([, n]) => n.toLowerCase() === i.toLowerCase());
    return s ? s[0] : "";
  }
  /** Build the form from an event. */
  _openEditor(e) {
    const t = this._googleId(e);
    if (!t) {
      this._editError = "This event has no id Google would recognise.";
      return;
    }
    const i = R(e.start), s = R(e.end), n = this._namedDays(ct(this._seriesRule(e)), e.start);
    this._draft = {
      key: e.key,
      entity: e.entity,
      eventId: t,
      isNew: !1,
      recurring: this._isRecurring(e),
      summary: e.summary,
      startDate: i.date,
      startTime: i.time,
      endDate: s.date,
      endTime: s.time,
      location: e.location ?? "",
      description: e.description ?? "",
      allDay: e.allDay,
      colorId: this._colorIdFor(e),
      colorIdWas: this._colorIdFor(e),
      // The series' own rule, read back out of what Home Assistant sent. A rule
      // this card cannot state in words comes back null, and canRepeat then
      // hides the row entirely rather than offering to overwrite it.
      repeat: n,
      repeatWas: n,
      canRepeat: !this._seriesRule(e) || !!n
    }, this._openPicker = null, this._pickerClosing = null, this._pickerMonth = null, this._detailsOpen = !!(e.location || e.description), this._colorOpen = !1, this._repeatOpen = !1, this._places = [], this._mapOpen = !1, this._mapPoint = null, this._scope = "instance", this._editError = null, this._confirmDelete = !1;
  }
  /**
   * The same form, empty, for an event that does not exist yet.
   *
   * It lands on the calendar currently on screen. That is the one being looked
   * at, the one whose colour the sheet takes, and the only one the card can
   * name — a calendar chooser inside the sheet would be a second picker
   * answering a question the header has already answered.
   */
  _openCreator(e, t = Ee) {
    const i = this._active?.entity;
    if (!i) return;
    const s = R(e), n = R(new Date(e.getTime() + t * 6e4));
    this._selected = void 0, this._draft = {
      key: `new:${e.getTime()}`,
      entity: i,
      eventId: "",
      isNew: !0,
      // "recurring" is about the event on Google, which this one is not yet; it
      // is what puts the scope question on the EDIT form. A repeat rule set here
      // is carried in `repeat` and applies from the moment it is created.
      recurring: !1,
      summary: "",
      startDate: s.date,
      startTime: s.time,
      endDate: n.date,
      endTime: n.time,
      location: "",
      description: "",
      allDay: !1,
      colorId: "",
      colorIdWas: "",
      repeat: null,
      repeatWas: null,
      canRepeat: !0
    }, this._openPicker = null, this._pickerClosing = null, this._pickerMonth = null, this._detailsOpen = !1, this._colorOpen = !1, this._repeatOpen = !1, this._cancelCustom(), this._places = [], this._mapOpen = !1, this._mapPoint = null, this._scope = "instance", this._editError = null, this._confirmDelete = !1;
  }
  /**
   * Size the month grid, and work out how much of a day each cell can show.
   *
   * One pass, because the two answers are the same arithmetic: a cell's height
   * decides how many events fit, and how many events fit decides the heights
   * worth clamping to. Splitting them meant measuring the same four numbers
   * twice and letting them disagree.
   *
   * The card is as tall as its contents, so CSS alone cannot make the rows fill
   * "the rest of the card" - there is no rest, the rows ARE the card. The height
   * is measured from the grid's own top to the bottom of the window and handed
   * back as a custom property, which the rows then share.
   *
   * That share is CLAMPED, in events rather than pixels: a cell never shrinks
   * below one event, and never grows past MONTH_FIT_MAX of them. Filling the
   * window and capping the cell are in genuine tension - a four-week month on a
   * tall screen hits the cap and leaves space under the grid - and the cap wins,
   * because a month cell that grows without limit stops being a summary.
   *
   * Every pixel but MONTH_BREATHE_PX is MEASURED off the rendered cell - the
   * date line, an event row, the gap, the padding - so changing a font size in
   * the CSS cannot silently start clipping. An event row is measured from a real
   * one where the month has any, and guessed where it has none, which only
   * matters for a month with nothing to fit.
   *
   * Writes reactive state, so a new month measures on one paint and draws on the
   * next. Both writes are guarded on the value actually CHANGING; without that
   * the second render would measure and schedule a third, forever.
   */
  _measureMonth() {
    const e = this.renderRoot?.querySelector(".mbody");
    if (!e) {
      this._monthGridH = 0, this._monthLaidOut && (this._monthLaidOut = "");
      return;
    }
    const t = `${Math.ceil(e.children.length / 7)}|${this._active?.entity ?? ""}`, i = () => {
      this._monthLaidOut !== t && (this._monthLaidOut = t);
    }, s = e.querySelector(".mcell");
    if (!s) {
      i();
      return;
    }
    const n = e.getAnimations?.({ subtree: !0 }).filter((D) => D.playState === "running");
    if (n?.length) {
      this._monthAwaitingAnim || (this._monthAwaitingAnim = !0, Promise.allSettled(n.map((D) => D.finished)).then(() => {
        this._monthAwaitingAnim = !1, this._measureMonth(), this._fitDayPeek();
      }));
      return;
    }
    const a = getComputedStyle(s), o = parseFloat(a.paddingTop) || 0, h = parseFloat(a.paddingBottom) || 0, r = (parseFloat(a.borderTopWidth) || 0) + (parseFloat(a.borderBottomWidth) || 0), l = parseFloat(a.rowGap) || 0, c = s.querySelector(".mdate")?.getBoundingClientRect().height || as, p = e.querySelector(".mev, .mmore")?.getBoundingClientRect().height || os;
    if (p < 1 || c < 1) {
      i();
      return;
    }
    const m = r + o + h + c + l + (this._monthTight ? wt : 0), g = (D) => Math.ceil(m + D * p + (D - 1) * l), u = this._isCompactMonth, w = u ? Rt : g(yt + 1), x = u ? ts : g(Se + 1), E = Math.max(1, Math.ceil(e.children.length / 7)), F = window.innerHeight - e.getBoundingClientRect().top - ns;
    let M = Math.floor(Math.min(x, Math.max(w, F / E))) * E, S = !1;
    if (Math.abs(M - this._monthGridH) >= E && (this._monthSeen.has(M) && (M = Math.min(...this._monthSeen, M)), this._monthSeen.add(M), this._monthSeen.size > Ji && (M = Math.min(...this._monthSeen)), M !== this._monthGridH && (this._monthGridH = M, e.style.setProperty("--mgrid-h", `${M}px`), S = !0)), u) {
      S ? this._monthLaidOut !== t && this.requestUpdate() : i();
      return;
    }
    const ne = (this._monthGridH || M) / E, ae = (D) => Math.min(
      Se + 1,
      Math.max(yt + 1, Math.floor((ne - D + l) / (p + l)))
    ), oe = ae(m), re = ae(m - wt), U = re > oe, he = U ? re : oe, v = he !== this._monthFit, k = U !== this._monthTight;
    k && (this._monthTight = U), v && (this._monthFit = he), !S && !v && !k ? this._monthLaidOut !== t && (this._monthLaidOut = t) : this._monthLaidOut !== t && !v && !k && this.requestUpdate();
  }
  /**
   * A tap anywhere in a month cell opens that DAY, never one event.
   *
   * The rows inside a cell are not links to their events: a month cell is a
   * summary, the names in it are truncated, and three of seven of them is not a
   * list you pick from. So the whole cell - the number, an event row, the
   * "N more" line, the empty space beside them - is one target, and the day
   * panel is where an event is actually chosen. That panel's rows still open the
   * detail sheet, so nothing is lost; it just takes the one honest route.
   *
   * Empty days open too, deliberately. "Nothing on this day" is an answer, and a
   * cell that sometimes responds to a tap and sometimes does not is worse.
   */
  _onMonthCellClick(e, t) {
    this._pressDid || this._openDayPeek(t, e.currentTarget);
  }
  /**
   * Open the day panel, positioned over the grid near the cell that asked.
   *
   * Coordinates are worked out against the GRID, not the viewport, so the panel
   * travels with the card if the dashboard scrolls under it.
   *
   * This only ANCHORS it - centred over the cell, roughly. Keeping it on screen
   * is `_fitDayPeek`'s job, once the panel exists and its height is a fact
   * rather than a guess.
   */
  _openDayPeek(e, t) {
    const i = this.renderRoot?.querySelector(".mgrid"), s = t.closest(".mcell");
    if (!i || !s) return;
    const n = i.getBoundingClientRect(), a = s.getBoundingClientRect(), o = a.left - n.left + a.width / 2 - vt / 2, h = a.top - n.top - 8;
    this._dayPeek = { day: e, left: Math.round(o), top: Math.round(h) };
  }
  /**
   * Pull the day panel back on screen.
   *
   * It has to run AFTER the panel renders, because its height depends on how
   * many events the day holds, and a cell in the bottom row of a busy month
   * opened a panel that ran off the bottom of the window - events you could
   * neither see nor reach. The old code clamped against DAY_PEEK_MIN_H, a
   * guess, and a seven-event panel is nearly twice that.
   *
   * Measured with offsetWidth/offsetHeight rather than getBoundingClientRect,
   * because the entry animation scales the panel from 0.9 and a transformed rect
   * would have it correcting against a size it is about to stop being.
   *
   * Clamped against the CARD, intersected with the window - not the window
   * alone. A panel pinned 8px from the left edge of the SCREEN still sits under
   * Home Assistant's sidebar and is just as unreadable; the same at the right
   * hung ten pixels past the card. What is visible is the card.
   */
  _fitDayPeek() {
    const e = this._dayPeek;
    if (!e) return;
    const t = this.renderRoot?.querySelector(".daypeek"), i = this.renderRoot?.querySelector(".mgrid");
    if (!t || !i) return;
    const s = i.getBoundingClientRect(), n = t.offsetWidth, a = t.offsetHeight;
    if (!n || !a) return;
    const o = s.left + e.left, h = s.top + e.top, r = this.getBoundingClientRect(), l = Math.max(A, r.left + A), c = Math.min(window.innerWidth - A, r.right - A) - n, p = Math.max(A, r.top + A), m = Math.min(window.innerHeight - A, r.bottom - A) - a, g = Math.max(l, Math.min(o, c)), u = Math.max(p, Math.min(h, m)), w = Math.round(e.left + (g - o)), x = Math.round(e.top + (u - h));
    w === e.left && x === e.top || (this._dayPeek = { ...e, left: w, top: x });
  }
  _closeDayPeek() {
    this._dayPeek && (this._dayPeek = null);
  }
  /**
   * Everything on one day, which is what the cell could not fit.
   *
   * Shows the END time as well as the start — the one place this deliberately
   * does more than Google's own version of this panel, because "4am" says
   * nothing useful about a collection that runs until 10.
   */
  _renderDayPeek(e) {
    const t = this._dayPeek;
    if (!t) return f;
    const i = O(e, t.day).sort((s, n) => s.start.getTime() - n.start.getTime());
    return d`
      <div class="peek-scrim" @click=${() => this._closeDayPeek()}></div>
      <div
        class="daypeek"
        style="left:${t.left}px; top:${t.top}px; width:${vt}px"
        @click=${(s) => s.stopPropagation()}
      >
        <div class="dp-title ${N(t.day, this._now) ? "today" : ""}">
          <div class="dp-head">
            <span class="dp-dow">${this._fmtDowLong(t.day)},</span>
            <button class="dp-close" aria-label="Close" @click=${() => this._closeDayPeek()}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="dp-date">${this._fmtDate(t.day)}</div>
        </div>
        <div class="dp-list">
          ${i.map(
      (s) => d`
              <button
                class="dp-row"
                @click=${() => {
        this._pickEvent(s);
      }}
              >
                <span class="mdot" style="background:${this._colorForEvent(s)}"></span>
                <span class="dp-when">
                  ${s.allDay ? "all day" : `${this._fmtTime(s.start)} – ${this._fmtTime(s.end)}`}
                </span>
                <span class="dp-name">${s.summary}</span>
              </button>
            `
    )}
        </div>
      </div>
    `;
  }
  /**
   * What the + button means by "now": the next slot on the snap grid.
   *
   * UP, where a press on the grid rounds down. A press names a slot and gets
   * that slot; the + names no time at all, and starting an event a quarter of
   * an hour in the past is a worse guess than starting it at the next one.
   */
  get _nowSlot() {
    const e = new Date(this._now);
    return e.setSeconds(0, 0), e.setMinutes(Math.ceil(e.getMinutes() / we) * we), e;
  }
  /** The same moment as minutes from midnight, which is what a day label takes. */
  get _nowMinutes() {
    const e = this._nowSlot;
    return e.getHours() * 60 + e.getMinutes();
  }
  /**
   * Begin a press-and-hold on empty space.
   *
   * Only in edit mode. The grid is also what a tablet gets held by, and in the
   * default view-only mode a press has to stay inert — a kiosk on a wall must
   * not be able to put an event in somebody's calendar by being leant on.
   *
   * Two surfaces offer it. A press on the TIMELINE claims the slot under the
   * finger; a press on a DAY LABEL claims the day at the current clock time.
   * They share a day index, which is why the press records which kind it is —
   * without that, pressing the label lit the row beside it as well.
   */
  _pressStart(e, t, i, s) {
    if (this._pressCancel(), this._pressDid = !1, !this._editMode || this._draft || e.button !== 0 || e.target?.closest(".ev, .lr:not(.empty)")) return;
    const n = e.currentTarget.getBoundingClientRect(), a = s.axis === "x" ? n.width : n.height;
    if (a <= 0) return;
    const o = s.axis === "x" ? e.clientX - n.left : e.clientY - n.top, h = Math.min(1, Math.max(0, o / a)), { from: r, to: l } = this._fitSlot(t, s.start + h * s.span);
    this._pressFrom = { x: e.clientX, y: e.clientY }, this._press = {
      idx: i,
      kind: s.kind,
      style: `${s.ghost(r, Math.min(l, s.start + s.span))};
              animation-duration:${gt}ms`
    };
    const c = new Date(j(t).getTime() + r * 6e4), p = l - r;
    window.addEventListener("pointermove", this._onPressMove, !0), window.addEventListener("pointerup", this._onPressEnd, !0), window.addEventListener("pointercancel", this._onPressEnd, !0), window.addEventListener("scroll", this._onPressEnd, !0), this._pressTimer = setTimeout(() => {
      this._pressTimer = void 0, this._press = null, this._pressDid = !0, this._pressCancel(), this._openCreator(c, p);
    }, gt);
  }
  /**
   * The slot a press actually claims, once the events around it are taken in.
   *
   * Half an hour by default, but a timetable is mostly gaps of five and fifteen
   * minutes, and an event that spills over the lesson after it is wrong in a way
   * that takes a trip to Google to undo. So the end is cut at whatever starts
   * next, and — just as important — the START is held at whatever ended last:
   * snapping to the quarter hour alone would push a press in the 9:15-9:30 gap
   * back to 9:15 and into the lesson before it when that ran to 9:20.
   */
  _fitSlot(e, t) {
    const i = j(e).getTime(), s = this._active?.entity;
    let n = 0, a = 24 * 60;
    for (const r of this._subs.events) {
      if (r.entity !== s || r.allDay) continue;
      const l = B(r.start, i), c = B(r.end, i);
      c <= t && c > n && (n = c), l > t && l < a && (a = l);
    }
    const o = Math.max(rs(t), n), h = a - o;
    return { from: o, to: o + (h > 0 ? Math.min(Ee, h) : Ee) };
  }
  _pressCancel() {
    this._pressTimer && clearTimeout(this._pressTimer), this._pressTimer = void 0, this._pressFrom = null, this._press && (this._press = null), window.removeEventListener("pointermove", this._onPressMove, !0), window.removeEventListener("pointerup", this._onPressEnd, !0), window.removeEventListener("pointercancel", this._onPressEnd, !0), window.removeEventListener("scroll", this._onPressEnd, !0);
  }
  _closeEditor() {
    this._selected || this._animEpoch++, this._draft = null, this._editError = null, this._confirmDelete = !1, this._busy = !1, this._openPicker = null, this._pickerClosing = null, this._pickerMonth = null, this._cancelCustom(), this._closeSheet();
  }
  /**
   * Collapse the open picker, letting the exit play.
   *
   * Everything that closes a picker while the FORM stays open goes through
   * here. The teardown paths — closing the editor, closing the window — clear
   * both fields instead, because there is nothing left to animate against.
   */
  _closePicker() {
    this._openPicker && (this._pickerClosing = this._openPicker, this._openPicker = null);
  }
  /** Open one inline picker, closing whichever was open. iOS shows one at a time. */
  _togglePicker(e) {
    if (this._confirmDelete = !1, this._openPicker === e) {
      this._closePicker();
      return;
    }
    this._pickerClosing = this._openPicker === e ? null : this._openPicker, this._openPicker = e, this._calDir = 0;
    const t = e === "untilDate" ? this._custom?.end.kind === "on" ? this._custom.end.date : "" : this._draft?.[e] ?? "";
    if (e !== "startTime" && e !== "endTime") {
      const [i, s] = t.split("-").map(Number);
      this._pickerMonth = { y: i || (/* @__PURE__ */ new Date()).getFullYear(), m: (s || 1) - 1 };
    }
    this._wheelsPending = !0;
  }
  /**
   * Keep the end after the start when the start moves.
   *
   * Picking a start later than the end is the single easiest mistake to make in
   * a form like this, and a validation error afterwards is a worse answer than
   * simply carrying the end along — which is what every calendar app does.
   */
  _patchStart(e) {
    const t = this._draft;
    if (!t) return;
    const i = (/* @__PURE__ */ new Date(`${t.startDate}T${t.startTime || "00:00"}`)).getTime(), s = (/* @__PURE__ */ new Date(`${t.endDate}T${t.endTime || "00:00"}`)).getTime(), n = Number.isFinite(i) && Number.isFinite(s) ? s - i : 0, a = { ...t, ...e }, o = (/* @__PURE__ */ new Date(`${a.startDate}T${a.startTime || "00:00"}`)).getTime();
    if (n > 0 && Number.isFinite(o)) {
      const h = new Date(o + n), r = R(h);
      a.endDate = r.date, a.endTime = r.time;
    }
    this._draft = a, this._confirmDelete = !1;
  }
  /**
   * Tapping an event: read it, or edit it.
   *
   * One entry point for all five places an event can be tapped — two grids, the
   * list, the all-day strip — so the mode can never be honoured in some of them
   * and not others.
   */
  _pickEvent(e) {
    this._selected = e, this._editMode && this._openEditor(e);
  }
  _patchDraft(e) {
    this._draft && (this._draft = { ...this._draft, ...e }, this._confirmDelete = !1);
  }
  /**
   * Call one of the pyscript services and report what came back.
   *
   * pyscript raises on failure and Home Assistant turns that into a rejected
   * call, so an error here is the real reason rather than a guess. It is shown
   * in the form instead of being thrown away, because the alternative is a Save
   * button that silently does nothing.
   */
  async _callEdit(e, t) {
    this._busy = !0, this._editError = null;
    try {
      return await this.hass.callService("pyscript", e, t), !0;
    } catch (i) {
      const s = i?.message ?? String(i);
      return this._editError = s.replace(/^[\s\S]*ValueError:\s*/, "").slice(0, 300), !1;
    }
  }
  /** The scope to send: meaningless for a one-off, so pinned to the occurrence. */
  get _sendScope() {
    return this._draft?.recurring ? this._scope : "instance";
  }
  /**
   * Everything the card is currently DRAWING, as one string.
   *
   * Compared before and after a write to tell whether the change has arrived.
   * It carries the fields the form can change — including colour, so that a
   * colour-only edit is noticed too — and nothing else, because anything else
   * would make it change for reasons that have nothing to do with this write.
   */
  _viewFingerprint() {
    const e = this._active?.entity, t = this._window;
    return this._subs.events.filter((i) => i.entity === e && i.start < t.end && i.end > t.start).map(
      (i) => [
        i.key,
        i.summary,
        i.start.getTime(),
        i.end.getTime(),
        i.allDay,
        i.location ?? "",
        i.description ?? "",
        this._colorForEvent(i)
      ].join("|")
    ).sort().join(`
`);
  }
  /**
   * Hold on until the week on screen reflects the write that just happened.
   *
   * Re-fetches on a slow beat and looks on a fast one, because the two are
   * different questions: Google may not have propagated yet (so ask again), and
   * a push may still be in flight (so look again). Gives up after
   * WRITE_SETTLE_MAX_MS — the write itself succeeded either way, and a form
   * that will not close is worse than one that closes a moment early.
   */
  async _settleAfterWrite(e, t) {
    if (!this.hass) return;
    const i = Date.now() + (t ? _s : bs);
    let s = 0;
    for (; Date.now() < i; ) {
      if (Date.now() >= s) {
        s = Date.now() + ys;
        const n = this._subWindow;
        await this._subs.forceUpdate(this.hass, this._entityIds), await this._subs.sync(this.hass, this._entityIds, n.start, n.end, !0), t && (await this._subs.refreshColorHelper(this.hass), await this._ensureEventColors(!0));
      }
      if (await new Promise((n) => setTimeout(n, ws)), this._viewFingerprint() !== e) return;
    }
  }
  /**
   * The thing that actually scrolls inside a draggable surface.
   *
   * The edit sheet scrolls itself; the custom-recurrence window scrolls its
   * body, and it is the WINDOW that should move when the body has nowhere to
   * go — a body sliding under its own header looks like a broken layout.
   */
  _dragScroller(e) {
    return e.querySelector(".rec-body") ?? e;
  }
  _onDragStart(e) {
    this._rubberFrom = e.touches.length === 1 ? e.touches[0].clientY : null;
  }
  _onDragMove(e) {
    const t = this._rubberFrom;
    if (t === null || e.touches.length !== 1) return;
    const i = e.currentTarget, s = this._dragScroller(i), n = e.touches[0].clientY - t, a = s.scrollHeight - s.clientHeight;
    if (!(a <= 1 || n > 0 && s.scrollTop <= 0 || n < 0 && s.scrollTop >= a - 1)) {
      this._rubberAt && this._setRubber(i, 0, !0);
      return;
    }
    e.cancelable && e.preventDefault();
    const h = fs * (1 - Math.exp(-Math.abs(n) / gs));
    this._setRubber(i, Math.sign(n) * h, !1);
  }
  _onDragEnd(e) {
    this._rubberFrom = null, this._rubberAt && this._setRubber(e.currentTarget, 0, !0);
  }
  /**
   * Written straight to the element, not through state.
   *
   * This runs on every touchmove; re-rendering the whole card sixty times a
   * second to move one box by a few pixels is not a trade worth making.
   */
  _setRubber(e, t, i) {
    this._rubberAt = t, e.classList.toggle("springing", i), e.style.setProperty("--rubber", `${t}px`);
  }
  /** Whether this save moves the colour, which needs the helper to re-run. */
  _colourMoved(e) {
    return e.colorId !== e.colorIdWas;
  }
  async _saveDraft() {
    const e = this._draft;
    if (!e || this._busy) return;
    if (!e.summary.trim()) {
      this._editError = "A title is required.";
      return;
    }
    const t = e.allDay && e.endDate <= e.startDate ? Vi(e.startDate) : e.endDate, i = e.allDay ? e.startDate : `${e.startDate} ${e.startTime}:00`, s = e.allDay ? t : `${e.endDate} ${e.endTime}:00`;
    if (!e.allDay && new Date(i.replace(" ", "T")) >= new Date(s.replace(" ", "T"))) {
      this._editError = "The end has to come after the start.";
      return;
    }
    const n = {
      entity_id: e.entity,
      summary: e.summary.trim(),
      start: i,
      end: s,
      all_day: e.allDay,
      location: e.location,
      description: e.description,
      // Sent ONLY when it moved — the same rule as the rrule, and for a
      // sharper reason than tidiness. The form SHOWS the colour an occurrence
      // inherits from its series, so re-sending it on a save that only touched
      // the title would pin that inherited colour onto the occurrence as its
      // own: nothing looks different, and then recolouring the series leaves
      // that one behind. An empty string is a deliberate CLEAR, which the
      // service turns into the null that removes the field; omitting it
      // entirely is "leave the colour alone".
      ...this._colourMoved(e) ? { color_id: e.colorId } : {}
    }, a = this._viewFingerprint();
    let o = !1;
    try {
      o = e.isNew ? await this._callEdit("simple_schedule_event_create", {
        ...n,
        // Only when there is one: the service reads a present rrule as "set
        // the recurrence", and an empty string would mean "clear it".
        ...e.repeat ? { rrule: dt(e.repeat, e.allDay) } : {}
      }) : await this._callEdit("simple_schedule_event_update", {
        ...n,
        event_id: e.eventId,
        scope: this._sendScope,
        // Sent ONLY when the rule actually moved. The service reads a
        // present rrule as "set the recurrence" and an empty string as
        // "clear it" — so sending the unchanged rule on every save would
        // rewrite the series for a change of title, and sending nothing
        // when it HAS moved would silently drop the edit.
        ...this._repeatMoved ? { rrule: e.repeat ? dt(e.repeat, e.allDay) : "" } : {}
      }), o && await this._settleAfterWrite(a, this._colourMoved(e));
    } finally {
      this._busy = !1;
    }
    o && this._closeEditor();
  }
  /** First press arms, second press deletes. Destructive and one-way. */
  async _deleteDraft() {
    const e = this._draft;
    if (!e || this._busy || e.isNew) return;
    if (!this._confirmDelete) {
      this._confirmDelete = !0;
      return;
    }
    const t = this._viewFingerprint();
    let i = !1;
    try {
      i = await this._callEdit("simple_schedule_event_delete", {
        entity_id: e.entity,
        event_id: e.eventId,
        scope: this._sendScope
      }), i && await this._settleAfterWrite(t, !1);
    } finally {
      this._busy = !1;
    }
    i && this._closeEditor();
  }
  /** Alternating keyframe name — see _animEpoch. */
  get _evAnim() {
    return this._animEpoch % 2 ? "evInB" : "evIn";
  }
  get _minContrast() {
    const e = this._config?.min_contrast;
    return typeof e == "number" ? e : $.min_contrast;
  }
  /** URL of the pyscript helper's output, or null when it is switched off. */
  get _helperUrl() {
    const e = this._config?.color_helper;
    return e === !1 ? null : typeof e == "string" && e ? e : vi;
  }
  /**
   * Refresh the per-event colour map. The helper rewrites it every 15 minutes,
   * so re-reading more often than that is pointless; `force` is for the refresh
   * button. A missing file is the normal "helper not installed" case and leaves
   * `_eventColors` null so every block falls back to its calendar's colour.
   */
  async _ensureEventColors(e = !1) {
    const t = this._helperUrl;
    if (!t) {
      this._eventColors = null;
      return;
    }
    if (!this._eventColorsPending && !(!e && this._eventColorsAt && Date.now() - this._eventColorsAt < 10 * 6e4)) {
      this._eventColorsPending = !0;
      try {
        this._eventColors = await xi(t), this._eventColorsAt = Date.now();
      } finally {
        this._eventColorsPending = !1;
      }
    }
  }
  /**
   * An event's dot, corrected for the surface it lands on.
   *
   * Every colour this card draws is chosen to read on the DARK card. Today's
   * month cell inverts to near-white, and on that a pale one all but disappears
   * — the grey of a general-waste bin against #ededed is about 1.7:1, which is
   * a smudge. Only on that cell, and only the dot: the text there is already
   * the inverted foreground, and the same colour on the dark cells is right as
   * it is.
   *
   * 3:1 is WCAG's threshold for a non-text graphic, which is what this is.
   */
  _dotColor(e, t) {
    const i = this._colorForEvent(e);
    return t ? Ae(i, ss, is) : i;
  }
  _colorFor(e) {
    const t = this._sources.findIndex((s) => s.entity === e), i = this._sources[t] ?? { entity: e };
    return yi(i, this._colors, t < 0 ? 0 : t);
  }
  /**
   * The colour of one block, most specific first: an explicit `event_colors`
   * title match, then Google's own per-event colour via the helper, then the
   * calendar's colour.
   */
  _colorForEvent(e) {
    return wi(e.summary, this._config?.event_colors) ?? ki(this._eventColors, e.uid, e.recurrenceId) ?? this._colorFor(e.entity);
  }
  /** The calendar's own name, as Home Assistant has it. Never a configured one. */
  _nameFor(e) {
    return xs(this.hass?.states?.[e]?.attributes?.friendly_name ?? e);
  }
  /**
   * The active calendar, with any header-toggle override folded in. Every read
   * of calendar_mode and view_width_mode goes through here, so overriding at
   * this one point reaches the axis, the lane packing and both renderers
   * without any of them knowing the modes can be changed at runtime.
   */
  get _active() {
    const e = this._sources[Math.min(this._activeIdx, this._sources.length - 1)];
    if (!e) return e;
    const t = this._modeOverride[e.entity];
    return t ? { ...e, ...t } : e;
  }
  /** The active calendar's mode, override first, then config, then default. */
  get _calendarMode() {
    const e = this._active?.calendar_mode;
    return e === "full" || e === "monthly" ? e : "focused";
  }
  /**
   * A month grid is its own layout, so almost every week-shaped rule bows out.
   *
   * NOT gated on the grid layout any more: a month stays a month on a phone,
   * scaled down rather than replaced by a week list. Seven columns still divide
   * the card, they are just narrow enough that a cell shows dots instead of
   * names — which is what every phone calendar does, and the day panel behind a
   * tap is the detail.
   */
  get _isMonth() {
    return this._calendarMode === "monthly";
  }
  /** The month, drawn for a phone: dots, no names, short weekday initials. */
  get _isCompactMonth() {
    return this._isMonth && this._mode === "list";
  }
  /**
   * How far from today the view is, in whatever unit it steps.
   *
   * The "today" button greys itself out on this. Reading `_weekOffset` alone
   * left it permanently grey in a month, where that offset never moves.
   */
  get _navOffset() {
    return this._isMonth ? this._monthOffset : this._weekOffset;
  }
  /** Per calendar, falling back to the card's own setting. See the type. */
  get _monthShowTimes() {
    return this._active?.month_mode_show_times ?? this._config?.month_mode_show_times ?? $.month_mode_show_times;
  }
  get _widthMode() {
    return this._active?.view_width_mode === "adaptive" ? "adaptive" : "fixed";
  }
  /**
   * Flip one mode for the active calendar only. Keyed by entity so each
   * calendar remembers its own shape while the card is open - a timetable and
   * a household calendar want different ones, which is why these are per
   * calendar in config to begin with. Deliberately NOT persisted: the YAML
   * stays the source of truth and a reload returns to it.
   */
  _toggleMode(e) {
    const t = this._sources[Math.min(this._activeIdx, this._sources.length - 1)];
    if (!t) return;
    this._resetMonthSettle();
    const i = this._active, s = e === "calendar_mode" ? {
      // focused -> full -> monthly -> focused. The first two are zoom
      // levels on a time axis; the third is a different shape entirely,
      // and it sits last so the two that are alike stay adjacent.
      calendar_mode: i.calendar_mode === "focused" ? "full" : i.calendar_mode === "full" ? "monthly" : "focused"
    } : {
      view_width_mode: i.view_width_mode === "adaptive" ? "fixed" : "adaptive"
    };
    this._modeOverride = {
      ...this._modeOverride,
      [t.entity]: { ...this._modeOverride[t.entity], ...s }
    }, this._animEpoch++;
  }
  /** The person's picture, if one is configured and set. */
  _avatarFor(e) {
    const t = e.person ? this.hass?.states?.[e.person]?.attributes?.entity_picture : void 0;
    return typeof t == "string" && t ? t : void 0;
  }
  /**
   * Open state for the calendar menu, with a document-level listener while it is
   * open so a click anywhere else dismisses it.
   *
   * The listener has to sit on `document` and test `composedPath()`: the card is
   * in a shadow root, so a click outside it never bubbles to anything the card
   * itself can see.
   */
  _setPicker(e) {
    e !== this._pickerOpen && (this._pickerOpen = e, e || this._animEpoch++, e ? (document.addEventListener("pointerdown", this._onOutside, !0), document.addEventListener("keydown", this._onPickerKey, !0)) : (document.removeEventListener("pointerdown", this._onOutside, !0), document.removeEventListener("keydown", this._onPickerKey, !0)));
  }
  _selectCalendar(e) {
    if (this._closeDayPeek(), this._setPicker(!1), e === this._activeIdx) return;
    this._resetMonthSettle();
    const t = e > this._activeIdx ? "fwd" : "back";
    this._navigate(t, () => {
      this._activeIdx = e;
    });
  }
  /** The arrows step whatever the card is showing: a week, or a month. */
  _goWeek(e) {
    this._closeDayPeek(), this._resetMonthSettle(), this._navigate(e > 0 ? "fwd" : "back", () => {
      this._isMonth ? this._monthOffset += e : this._weekOffset += e;
    });
  }
  _goToday() {
    const e = this._navOffset;
    if (e === 0) return;
    const t = e > 0 ? "back" : "fwd";
    this._resetMonthSettle(), this._navigate(t, () => {
      this._isMonth ? this._monthOffset = 0 : this._weekOffset = 0;
    });
  }
  /* ------------------------------------------------------------------ *
   * Changing week, in two halves.
   *
   * The week leaving FADES AND FOLDS AWAY first, and only then is the new one
   * built and brought in, cell by cell. One half on its own is what made this
   * read as "basic" - the CSS `.dir-*` rules bring a week in, but nothing ever
   * saw the old one go, so the change was a 28px nudge over content that had
   * already been swapped underneath it.
   *
   * The out half has to be imperative: the old week's DOM stops existing the
   * moment the state changes, so it cannot be animated by a rule that only
   * applies after the render.
   * ------------------------------------------------------------------ */
  /**
   * Whether this card should hold still.
   *
   * Follows the OPERATING SYSTEM by default, which is why an identical card can
   * animate on one machine and not on another: Windows' Settings > Accessibility
   * > Visual effects > Animation effects, and macOS' Reduce Motion, are both
   * reported to the browser as `prefers-reduced-motion: reduce`, and that used
   * to silence every animation here with no way to say otherwise. `animations`
   * is that way — see the option's docs.
   *
   * Read through a getter rather than cached because the OS setting can be
   * flipped while the page is open; _motionQuery re-renders when it is.
   */
  get _reducedMotion() {
    const e = this._config?.animations ?? $.animations;
    return e === "always" ? !1 : e === "off" ? !0 : this._motionQuery.matches;
  }
  /**
   * Exactly the elements the CSS `.dir-fwd` / `.dir-back` rules bring back in.
   *
   * The week range is one of them. It names the week being shown, so leaving it
   * to swap its text under a schedule that fades and slides made it the one part
   * of the card that jump-cut.
   */
  get _contentEls() {
    return Array.from(
      this.renderRoot?.querySelectorAll(
        ".range, .list, .rgrid .rframe, .grid .body, .grid .hdr"
      ) ?? []
    );
  }
  /**
   * Commit a navigation whose fade-out is still running.
   *
   * Clicking an arrow twice quickly must step two weeks, not one. The pending
   * change is applied at once and the new one starts its own fade, so the second
   * click is never swallowed by the first click's animation.
   */
  _flushNav() {
    const e = this._navApply;
    e && e();
  }
  _navigate(e, t) {
    this._flushNav(), this._selected = void 0;
    const i = () => {
      this._navApply = void 0, this._staleAnims.push(...this._navAnims), this._navAnims = [], t(), this._navDir = e, this._animEpoch++;
    }, s = this._contentEls;
    if (this._reducedMotion || !s.length) {
      i();
      return;
    }
    const n = e === "fwd" ? -ft : ft;
    this._navApply = i, this._navAnims = s.map(
      (o) => o.animate(
        [
          { opacity: "1", transform: "none" },
          { opacity: "0", transform: `translateX(${n}px) scale(${Ki})` }
        ],
        { duration: ji, easing: Gi, fill: "forwards" }
      )
    ), this._navAnims[this._navAnims.length - 1].finished.then(() => this._flushNav()).catch(() => {
    });
  }
  /**
   * Refresh everything, in the order the data actually flows.
   *
   * A refresh that only re-read what Home Assistant already held was useless:
   * Google's coordinator caches for 15 minutes, so a change made in Google
   * simply was not there yet. The full chain is
   *
   *   1. force the calendars to re-poll Google,
   *   2. wait for that to land,
   *   3. have the colour helper republish from the freshly updated store,
   *   4. re-subscribe and re-read both colour sources.
   *
   * Steps 1 and 3 are best-effort: neither the integration's polling nor the
   * helper is guaranteed to be present, and the card must still refresh what it
   * can without them.
   */
  async _refresh() {
    if (this._refreshing || !this.hass) return;
    this._refreshing = !0;
    const e = Date.now();
    this._spinTimer && clearTimeout(this._spinTimer);
    const t = setTimeout(() => {
      this._refreshing = !1;
    }, us);
    try {
      await this._subs.forceUpdate(this.hass, this._entityIds), await new Promise((s) => setTimeout(s, ms)), await this._subs.refreshColorHelper(this.hass);
      const i = this._subWindow;
      this._subs.clear(), await Promise.all([
        this._subs.sync(this.hass, this._entityIds, i.start, i.end, !0),
        this._ensureColors(!0),
        this._ensureEventColors(!0)
      ]);
    } finally {
      clearTimeout(t);
      const i = Math.max(0, ps - (Date.now() - e));
      this._spinTimer = setTimeout(() => {
        this._refreshing = !1;
      }, i);
    }
  }
  render() {
    if (!this._config || !this.hass) return f;
    const e = this._config, t = this._window, i = this._active?.entity, s = this._subs.events.filter(
      (h) => h.entity === i && h.start < t.end && h.end > t.start
    ), n = s.filter((h) => !h.allDay), a = mi(n, e.day_start ?? $.day_start, e.day_end ?? $.day_end), o = this._mode === "list";
    return d`
      <ha-card>
        <div
          class="panel ${o ? "narrow" : ""} ${this._reducedMotion ? "reduce" : ""} ${this._flash ? this._flashOut ? "flash-out" : "flash" : ""}"
          style=${this._hostWidth > 0 ? `--ssc-w:${this._hostWidth}px` : f}
        >
          ${this._renderHead(t.days)}
          <!-- A month keeps its grid at every width; only the week shapes fall
               back to a list, which has no month to fall back TO. -->
          ${o && !this._isMonth ? this._renderList(t.days, s) : this._renderGrid(t.days, s, a)}
        </div>
        ${this._renderSheet()}
        <!-- The one-shot wash on entering edit mode. Keyed on a counter so a
             second entry re-runs it: an animation only restarts when the
             element is new, and this element is otherwise identical. -->
        ${this._flash ? d`<div
              class="mode-flash ${this._flashOut ? "out" : ""}"
              .key=${this._flash}
              @animationend=${() => this._flash = 0}
            ></div>` : f}
      </ha-card>
    `;
  }
  /** Config pins the layout; 'auto' picks by the card's own measured width. */
  get _mode() {
    const e = this._config?.layout ?? $.layout;
    if (e === "grid" || e === "list") return e;
    const t = this._config?.layout_breakpoint ?? $.layout_breakpoint;
    return this._hostWidth > 0 && this._hostWidth < t ? "list" : "grid";
  }
  /**
   * How far the week on screen is from the current one, in words.
   *
   * ALWAYS returns something. It used to go blank past one week either side, on
   * the reasoning that the date range said it better — but the list layout drops
   * the range entirely, so the pill became the only thing naming the week and a
   * blank pill left nothing at all.
   *
   * The unit coarsens as the distance grows, because "In 34 Weeks" is a number
   * to be decoded rather than read. Weeks up to WEEKS_BEFORE_MONTHS, then
   * months, then years once the month count would reach twelve.
   */
  get _weekLabel() {
    if (this._isMonth) return this._monthLabel;
    const e = this._weekOffset;
    if (e === 0) return "This Week";
    const t = e > 0, i = Math.abs(e);
    if (i === 1) return t ? "Next Week" : "Last Week";
    let s = i, n = "Week";
    i > Yi && (s = Math.round(i / Bi), n = "Month", s >= 12 && (s = Math.round(i / qi), n = "Year"));
    const a = `${s} ${n}${s === 1 ? "" : "s"}`;
    return t ? `In ${a}` : `${a} Ago`;
  }
  /**
   * The same sentence as the week pill, counted in months.
   *
   * Exact rather than derived from weeks: a month grid is paged a month at a
   * time, so "In 2 Months" is a fact here rather than the rounding the week
   * pill has to do.
   */
  get _monthLabel() {
    const e = this._monthOffset;
    if (e === 0) return "This Month";
    const t = e > 0, i = Math.abs(e);
    if (i === 1) return t ? "Next Month" : "Last Month";
    let s = i, n = "Month";
    i >= 12 && (s = Math.round(i / 12), n = "Year");
    const a = `${s} ${n}${s === 1 ? "" : "s"}`;
    return t ? `In ${a}` : `${a} Ago`;
  }
  /** Avatar, or the calendar's initial on its own colour when there is none. */
  _renderAvatar(e) {
    const t = this._avatarFor(e);
    if (t) return d`<img class="av" src=${t} alt="" />`;
    const i = Ae(this._colorFor(e.entity), this._minContrast), s = (this._nameFor(e.entity).trim()[0] ?? "?").toUpperCase();
    return d`<span class="av init" style="background:${i}">${s}</span>`;
  }
  /**
   * The card's heading: avatar, the calendar's own name, and — when there is
   * more than one calendar — a chevron. The whole thing is the target, not just
   * the chevron.
   *
   * There is no separate card title. The calendar being shown IS the title, so
   * a single calendar renders the same heading without the chevron or the menu,
   * rather than a control that cannot do anything.
   */
  _renderPicker() {
    const e = this._sources, t = e.length > 1, i = this._active;
    return d`
      <div class="picker">
        <button
          class="pick-btn ${t ? "" : "static"}"
          ?disabled=${!t}
          aria-haspopup=${t ? "listbox" : f}
          aria-expanded=${t ? this._pickerOpen ? "true" : "false" : f}
          @click=${() => {
      t && this._setPicker(!this._pickerOpen);
    }}
        >
          ${this._renderAvatar(i)}
          <span class="pick-name">${this._nameFor(i.entity)}</span>
          ${t ? d`<ha-icon
                class="pick-chev ${this._pickerOpen ? "open" : ""}"
                icon="mdi:chevron-down"
              ></ha-icon>` : f}
        </button>
        <div class="pick-menu ${this._pickerOpen ? "open" : ""}" role="listbox">
          ${e.map(
      (s, n) => d`
              <button
                class="pick-item ${n === this._activeIdx ? "sel" : ""}"
                role="option"
                aria-selected=${n === this._activeIdx ? "true" : "false"}
                @click=${() => this._selectCalendar(n)}
              >
                ${this._renderAvatar(s)}
                <span class="pick-name">${this._nameFor(s.entity)}</span>
              </button>
            `
    )}
        </div>
      </div>
    `;
  }
  _renderHead(e) {
    const t = this._config, i = this._subs.failed, n = this._mode === "list" && !this._isMonth || !e.length ? "" : this._isMonth ? (
      // The month grid spills into its neighbours by design, so a first-to-
      // last date range would read "Aug 31 - Oct 11" for September. The
      // month's own name is the only honest label.
      tt(this._now, this._monthOffset).toLocaleDateString(this._lang, {
        month: "long",
        year: "numeric"
      })
    ) : `${this._fmtDate(e[0])} – ${this._fmtDate(e[e.length - 1])}`, a = this._isMonth && this._mode === "grid" ? "centre" : "right", o = d`
      <div class="range ${a} dir-${this._navDir}">
        ${n}<span class="pill">${this._weekLabel}</span>
      </div>
    `;
    return d`
      <div class="head ${this._sheetOpen ? "dimmed" : ""}">
        <div class="titles">
          ${this._renderPicker()}
          <!-- Both only in edit mode, and both in the same breath: the pill says
               the card is armed, and the + is the one thing that mode offers
               which pressing the grid cannot reach on a phone, where the list
               layout has no timeline to press. -->
          ${this._editMode ? d`
                <span class="pill edit-pill">Edit Mode</span>
                <button
                  class="pill add-pill"
                  aria-label="Add event"
                  title="Add event"
                  @click=${() => this._openCreator(this._nowSlot)}
                >
                  <ha-icon icon="mdi:plus"></ha-icon>
                </button>
              ` : f}
        </div>
        <!-- MONTH MODE ONLY. There the period is the answer to "which month am
             I in", it changes under you as you page, and at 15px under the
             arrows on the right - where you go to CHANGE it rather than to read
             it - it was the smallest thing in the header. A week grid names its
             days in every column heading and needs no such sign, so it keeps
             the range where it has always been. -->
        <div class="head-centre">
          ${this._renderModeToggles()}
          ${a === "centre" ? o : f}
        </div>
        <div class="head-right">
          <div class="tools">
          ${i.length ? d`<div class="warn" title=${i.join(", ")}>
                <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
              </div>` : f}
          <button
            class="btn"
            @click=${() => this._goWeek(-1)}
            aria-label=${this._isMonth ? "Previous month" : "Previous week"}
          >
            <ha-icon icon="mdi:chevron-left"></ha-icon>
          </button>
          <button
            class="btn today ${this._navOffset === 0 ? "off" : ""}"
            @click=${() => this._goToday()}
            aria-label=${this._isMonth ? "This month" : "This week"}
          >
            <ha-icon icon="mdi:calendar-today"></ha-icon>
          </button>
          <button
            class="btn"
            @click=${() => this._goWeek(1)}
            aria-label=${this._isMonth ? "Next month" : "Next week"}
          >
            <ha-icon icon="mdi:chevron-right"></ha-icon>
          </button>
          ${t.show_refresh ?? $.show_refresh ? this._renderToolsMenu() : f}
          </div>
          ${a === "right" ? o : f}
        </div>
      </div>
    `;
  }
  /**
   * The overflow menu, in the slot the refresh button used to hold on its own.
   *
   * Refresh moved INTO it rather than sitting beside it: the header already
   * carries four buttons on a phone, and a fifth for a mode that is used once in
   * a while would have cost the calendar name the width it needs. The button
   * still spins while a refresh runs, so the feedback did not move with it.
   */
  _renderToolsMenu() {
    const e = this._menuOpen;
    return d`
      <div class="tools-menu-wrap">
        <button
          class="btn ${this._refreshing ? "spin" : ""} ${e ? "on" : ""}"
          aria-haspopup="menu"
          aria-expanded=${e ? "true" : "false"}
          aria-label="More"
          @click=${() => this._setMenu(!e)}
        >
          <ha-icon icon=${this._refreshing ? "mdi:refresh" : "mdi:dots-horizontal"}></ha-icon>
        </button>
        <div
          class="pick-menu menu-right ${e ? "open" : ""}"
          role="menu"
          style="--menu-items:${this._shapeItemShown ? 3 : 2}"
        >
          ${this._renderShapeItem()}
          <button
            class="pick-item"
            role="menuitem"
            @click=${() => {
      this._setMenu(!1), this._refresh();
    }}
          >
            <ha-icon icon="mdi:refresh"></ha-icon>
            <span class="pick-name">Refresh calendar</span>
          </button>
          <button
            class="pick-item ${this._editMode ? "sel" : ""}"
            role="menuitem"
            @click=${() => this._toggleEditMode()}
          >
            <ha-icon icon=${this._editMode ? "mdi:pencil-off" : "mdi:pencil"}></ha-icon>
            <span class="pick-name">
              ${this._editMode ? "Leave Edit Mode" : "Enter Edit Mode"}
            </span>
          </button>
        </div>
      </div>
    `;
  }
  /**
   * The two mode toggles, centred in the header.
   *
   * Each shows the mode it is CURRENTLY in rather than the one it would switch
   * to - a toggle that displays its own destination reads backwards the moment
   * you stop looking at it - and is highlighted when it is on the non-default
   * setting, so a glance says whether the view has been reshaped.
   *
   * Only offered where they mean something: the list layout has no time axis at
   * all, and view_width_mode has nothing to fit unless the days run as rows.
   */
  /**
   * The month/list switch, as a menu command.
   *
   * The centre toggles are a grid-layout control and vanish with it, which left
   * the phone with no way out of whichever shape the YAML chose. This is the
   * same job with the two choices a narrow card actually has: the month grid, or
   * the day-grouped list. The three-way cycle would be wrong here - `focused`
   * and `full` are zoom levels on a time axis, and a phone has no time axis to
   * zoom.
   *
   * Unlike the header toggles, this NAMES ITS DESTINATION. Those show the mode
   * they are in, because a button that shows where it would take you reads
   * backwards the moment you look away; a menu item is a command and has room
   * to say what it does. The icons are the same pair either way.
   *
   * Leaving a month goes back to whatever the calendar was configured as, not
   * to a hardcoded default, so a card set to `full` returns to `full`.
   */
  get _shapeItemShown() {
    const e = this._config;
    return !e || !(e.show_mode_toggles ?? $.show_mode_toggles) || this._mode !== "list" ? !1 : !!this._sources[Math.min(this._activeIdx, this._sources.length - 1)];
  }
  _renderShapeItem() {
    if (!this._shapeItemShown) return f;
    const e = this._config, t = this._sources[Math.min(this._activeIdx, this._sources.length - 1)], i = this._isMonth, s = fe[e.mode_toggle_icons ?? $.mode_toggle_icons] ?? fe[$.mode_toggle_icons];
    return d`
      <button
        class="pick-item"
        role="menuitem"
        @click=${() => {
      this._setMenu(!1), this._resetMonthSettle(), this._closeDayPeek(), this._modeOverride = {
        ...this._modeOverride,
        [t.entity]: {
          ...this._modeOverride[t.entity],
          // Back to the configured shape, which is only a month if the YAML
          // says so - in which case the list is the other choice.
          calendar_mode: i ? t.calendar_mode === "monthly" ? "focused" : t.calendar_mode ?? "focused" : "monthly"
        }
      }, this._animEpoch++;
    }}
      >
        <ha-icon icon=${i ? "mdi:view-agenda-outline" : s.monthly}></ha-icon>
        <span class="pick-name">
          ${i ? "Switch to Weekly View" : "Switch to Monthly View"}
        </span>
      </button>
    `;
  }
  _renderModeToggles() {
    const e = this._config;
    if (!(e.show_mode_toggles ?? $.show_mode_toggles) || this._mode !== "grid") return f;
    const t = this._calendarMode === "full", i = this._widthMode === "adaptive", s = this._orientation === "days-as-rows", n = this._isMonth, a = fe[e.mode_toggle_icons ?? $.mode_toggle_icons] ?? fe[$.mode_toggle_icons];
    return d`
      <div class="mode-toggles">
        <button
          class="btn ${t || n ? "on" : ""}"
          @click=${() => this._toggleMode("calendar_mode")}
          title=${n ? "The month - tap to go back to the day" : t ? "Whole day - tap for the month" : "Fitted to the events - tap for the whole day"}
          aria-label="Time span"
        >
          <ha-icon icon=${n ? a.monthly : t ? a.full : a.focused}></ha-icon>
        </button>
        <!-- Collapsed rather than dropped when the month grid has no width to
             set. Removing it would make it vanish and reappear with nothing to
             animate; collapsing lets it slide out and back in. The element is
             inert while away so it cannot be tabbed to. -->
        ${s ? d`<button
              class="btn width-toggle ${i ? "on" : ""} ${n ? "gone" : ""}"
              tabindex=${n ? "-1" : "0"}
              aria-hidden=${n ? "true" : "false"}
              @click=${() => {
      n || this._toggleMode("view_width_mode");
    }}
              title=${i ? "Fitted to the card - tap for a fixed scale" : "Fixed scale, scrolls - tap to fit the card"}
              aria-label="Width"
            >
              <ha-icon icon=${i ? a.adaptive : a.fixed}></ha-icon>
            </button>` : f}
      </div>
    `;
  }
  /**
   * Size and place the custom scrollbar thumb.
   *
   * Called on scroll AND from `updated`, because on first paint there has been
   * no scroll event yet and the bar has to be there from the start — its job is
   * to tell you there is more schedule off-screen, which is most useful before
   * you have touched anything.
   *
   * Fractions rather than pixels: the track sits under the hour columns only, so
   * it is narrower than the scroller.
   */
  _measureScrollbar(e) {
    const t = e ?? this.renderRoot?.querySelector(".rscroll");
    if (!t) return;
    const { scrollLeft: i, scrollWidth: s, clientWidth: n } = t;
    if (n && Math.abs(n - this._axisPx) > 0.5 && (this._axisPx = n), s <= n + 1) {
      this._hThumb && (this._hThumb = null);
      return;
    }
    const a = Math.max(6, n / s * 100), o = i / (s - n) * (100 - a), h = this._hThumb;
    (!h || Math.abs(h.left - o) > 0.05 || Math.abs(h.width - a) > 0.05) && (this._hThumb = { left: o, width: a });
  }
  /**
   * Park the scroller where the active calendar should open: just before the
   * first event for a full-day calendar, and 0 for a focused one — where x=0 is
   * the first event already, but still needs setting so a switch does not
   * inherit the previous calendar's position.
   *
   * The assignment is retried across a few frames because layout is not settled
   * on the update that first renders the grid, and a scrollLeft set before the
   * content is scrollable is silently CLAMPED TO ZERO — recording the position
   * as done before checking left the card sitting at midnight.
   */
  _focusScroller() {
    const e = `${this._weekOffset}|${this._activeIdx}|${this._focusPx}`;
    if (e === this._focusKey || this._focusBusy) return;
    const t = this.renderRoot?.querySelector(".rscroll");
    if (!t) return;
    this._focusBusy = !0;
    let i = 0;
    const s = () => {
      if (t.scrollLeft = this._focusPx, Math.abs(t.scrollLeft - this._focusPx) < 2) {
        this._focusKey = e, this._focusBusy = !1;
        return;
      }
      i++ < 12 ? requestAnimationFrame(s) : this._focusBusy = !1;
    };
    s();
  }
  _onHScroll(e) {
    this._measureScrollbar(e.currentTarget);
  }
  get _scrollerEl() {
    return this.renderRoot?.querySelector(".rscroll") ?? null;
  }
  _barDown(e) {
    const t = e.currentTarget, i = t.querySelector(".hthumb"), s = this._scrollerEl;
    if (!i || !s) return;
    const n = t.getBoundingClientRect(), a = i.getBoundingClientRect(), o = s.scrollWidth - s.clientWidth, h = Math.max(1, n.width - a.width);
    if (o <= 0) return;
    let r = a.left - n.left;
    (e.clientX < a.left || e.clientX > a.right) && (r = Math.max(0, Math.min(h, e.clientX - n.left - a.width / 2)), s.scrollLeft = r / h * o), this._barDrag = { x0: e.clientX, left0: r, travel: h, max: o }, t.classList.add("dragging");
    try {
      t.setPointerCapture(e.pointerId);
    } catch {
    }
    e.preventDefault();
  }
  _barMove(e) {
    const t = this._barDrag, i = this._scrollerEl;
    if (!t || !i) return;
    const s = Math.max(0, Math.min(t.travel, t.left0 + (e.clientX - t.x0)));
    i.scrollLeft = s / t.travel * t.max, e.preventDefault();
  }
  _barUp(e) {
    if (!this._barDrag) return;
    this._barDrag = null;
    const t = e.currentTarget;
    t.classList.remove("dragging");
    try {
      t.releasePointerCapture(e.pointerId);
    } catch {
    }
  }
  get _orientation() {
    return this._config?.orientation === "days-as-rows" ? "days-as-rows" : "days-as-columns";
  }
  /**
   * The two orientations share everything that matters — the same events, the
   * same lane packing, the same colours, the same uniform-lattice rule. Only the
   * axis each one runs along differs, so `placeWeek`'s `column` is read as a
   * sub-column in one and a stacked sub-row in the other.
   */
  _renderGrid(e, t, i) {
    return this._isMonth ? this._renderMonth(e, t) : this._orientation === "days-as-rows" ? this._renderRowsGrid(e, t, i) : this._renderColumnsGrid(e, t, i);
  }
  /**
   * The month grid: whole weeks of seven, weekday names across the top.
   *
   * For calendars whose events are DATES rather than appointments — bin
   * collections, birthdays, term dates. A time axis for those is mostly empty
   * space with a few marks in it, which is why this exists as its own shape
   * rather than as a zoom level on the week grid.
   *
   * Seven columns divide the card, so a month never scrolls sideways. That is
   * the one place this deliberately departs from `view_width_mode: fixed`: a
   * month you have to scroll to see the end of is not a month.
   */
  _renderMonth(e, t) {
    const i = this._isCompactMonth, s = i ? es : this._monthFit, n = this._monthShowTimes && !i, a = tt(this._now, this._monthOffset).getMonth(), o = [];
    for (let r = 0; r < 7; r++) {
      const l = new Date(2024, 0, 1 + r);
      o.push(
        i ? this._fmtDowLong(l).slice(0, 2).toUpperCase() : this._fmtDowLong(l)
      );
    }
    const h = e.findIndex((r) => N(r, this._now)) % 7;
    return d`
      <div
        class="mgrid dir-${this._navDir} ${i ? "compact" : ""} ${this._receded ? "dimmed" : ""} ${this._editMode ? "editing" : ""}"
        @animationend=${() => {
      this._navDir = "none";
    }}
      >
        <div class="mhead">
          ${o.map(
      (r, l) => d`<div class="mdow ${l === h ? "today" : ""}">${r}</div>`
    )}
        </div>
        <div
          class="mbody ${this._monthTight ? "tight" : ""} ${`${e.length / 7}|${this._active?.entity ?? ""}` !== this._monthLaidOut ? "probing" : ""}"
        >
          ${e.map((r, l) => {
      const c = O(t, r).sort(
        (x, E) => x.start.getTime() - E.start.getTime()
      ), p = i ? s : Math.min(s, Se), m = c.slice(0, c.length > p ? Math.min(s - 1, p) : p), g = c.length - m.length, u = r.getMonth() !== a, w = Math.floor(l / 7) * pe;
      return d`
              <div
                class="mcell ${u ? "out" : ""} ${N(r, this._now) ? "today" : ""}"
                style="animation-name:${this._evAnim}; animation-delay:${w}ms"
                @pointerdown=${(x) => this._pressStart(x, r, l, me(this._nowMinutes))}
                @click=${(x) => this._onMonthCellClick(x, r)}
                @contextmenu=${(x) => {
        this._editMode && x.preventDefault();
      }}
              >
                <div class="mdate">${r.getDate()}</div>
                <!-- display:contents in the roomy layout, so this wrapper is
                     invisible there; a wrapping flex row on a phone, where the
                     events are dots that flow rather than stack. -->
                <div class="mevs">
                ${m.map(
        (x) => d`
                    <div class="mev">
                      <span
                        class="mdot"
                        style="background:${this._dotColor(x, N(r, this._now))}"
                      ></span>
                      ${n && !x.allDay ? d`<span class="mtime">${this._fmtTime(x.start)}</span>` : f}
                      <span class="mname">${x.summary}</span>
                    </div>
                  `
      )}
                ${g > 0 ? d`<div class="mmore">${i ? `+${g}` : `${g} more`}</div>` : f}
                </div>
                ${this._press?.idx === l && this._press.kind === "label" ? d`<div class="press-ghost head" style=${this._press.style}></div>` : f}
              </div>
            `;
    })}
        </div>
        ${this._renderDayPeek(t)}
      </div>
    `;
  }
  /** Days down the left, time across the top — the printed-timetable shape. */
  _renderRowsGrid(e, t, i) {
    const s = this._config, n = s.day_height ?? $.day_height, a = s.hour_width ?? $.hour_width, o = this._calendarMode === "full", h = o ? 0 : i.start, r = o ? 24 * 60 : i.end, l = r - h, c = this._widthMode === "adaptive", p = Math.round(l / 60 * a), m = c ? "%" : "px", g = c ? 100 : p, u = (v) => (v - h) / l * (c ? 100 : p), w = u(h + Fi) - u(h), x = c ? mt / Math.max(1, this._axisPx || p) * 100 : mt, E = e.map((v) => O(t.filter((k) => !k.allDay), v)), F = this._active ? [this._active.entity] : [], H = ht(E, s.lane_mode ?? $.lane_mode, F), M = H.columns * n, S = e.map((v) => O(t.filter((k) => k.allDay), v)), ne = [];
    for (let v = Math.ceil(h / 60) * 60; v <= r; v += 60) ne.push(v);
    const ae = Math.max(160, (this._hostWidth || 1e3) - ds - cs * 2), oe = c ? ae / (l / 60) : a, re = Math.max(1, Math.ceil(hs / oe)), U = ne.filter((v, k) => k % re === 0), he = e.findIndex((v) => N(v, this._now));
    return this._focusPx = o && !c ? Math.max(0, Math.round((i.start - ls - h) / l * p)) : 0, d`
      <div
        class="rgrid dir-${this._navDir} ${this._receded ? "dimmed" : ""} ${this._editMode ? "editing" : ""}"
        style="--row-h:${M}px; --lane-h:${n}px"
      >
        <div
          class="rframe"
          @animationend=${() => {
      this._navDir = "none";
    }}
        >
          <!-- Outside the scroller on purpose. As a sticky child it bulged
               during the rubber-band: overscroll drives scrollLeft negative,
               and sticky only ever pushes an element right, so it travelled
               with the content. Out here it cannot move at all, while the hours
               keep their bounce. -->
          <div class="rdays">
            <div class="rcorner"></div>
            ${e.map(
      (v, k) => d`
                <div
                  class="rday ${k % 2 ? "alt" : ""} ${k === he ? "today" : ""}"
                  @pointerdown=${(D) => this._pressStart(D, v, k, me(this._nowMinutes))}
                  @contextmenu=${(D) => {
        this._editMode && D.preventDefault();
      }}
                >
                  <span class="dow">${this._fmtDowLong(v)},</span>
                  <span class="dnum">${this._fmtDate(v)}</span>
                  ${this._press?.idx === k && this._press.kind === "label" ? d`<div class="press-ghost head" style=${this._press.style}></div>` : f}
                </div>
              `
    )}
          </div>

          <div class="rscroll" @scroll=${(v) => this._onHScroll(v)}>
            <div class="rinner" style="--axis-w:${c ? "100%" : `${p}px`}">
              <div class="rtimes">
                ${U.map(
      (v) => d`<div
                      class="rhr ${u(v) < 0.5 ? "first" : ""} ${u(v) >= g - x ? "last" : ""}"
                      style="left:${u(v)}${m}"
                    >
                      ${this._fmtHour(v)}
                    </div>`
    )}
              </div>

              ${e.map((v, k) => {
      const D = j(v).getTime();
      return d`
                  <div
                    class="rcanvas ${k % 2 ? "alt" : ""}"
                    @pointerdown=${(T) => this._pressStart(T, v, k, {
        axis: "x",
        start: h,
        span: l,
        // NO minimum width, unlike a real block. The floor is
        // there so a five-minute lesson is still readable; on
        // the ghost it made a five-minute SLOT draw twelve
        // minutes wide and reach into the lesson after it, which
        // read as the gap not working at all. It has to tell the
        // truth about what it is claiming, however thin.
        kind: "slot",
        ghost: (le, Y) => `left:${u(le)}${m}; width:${u(Y) - u(le)}${m};
                           top:0; height:100%`
      })}
                    @contextmenu=${(T) => {
        this._editMode && T.preventDefault();
      }}
                  >
                    ${this._press?.idx === k && this._press.kind === "slot" ? d`<div class="press-ghost" style=${this._press.style}></div>` : f}
                    <div class="rlines">
                      ${U.map(
        (T) => d`<div class="rline" style="left:${u(T)}${m}"></div>`
      )}
                    </div>
                    ${S[k].map(
        (T) => d`
                        <div
                          class="ev rev"
                          style="left:0; width:100%; top:0; height:${n}px;
                                 animation-name:${this._evAnim}; animation-delay:${k * pe}ms;
                                 ${ge(this._colorForEvent(T), this._minContrast)}"
                          @click=${() => this._pickEvent(T)}
                        >
                          <div class="ev-in"><div class="ev-name">${T.summary}</div></div>
                        </div>
                      `
      )}
                    ${H.days[k].map(({ ev: T, column: le }) => {
        const Y = Math.max(h, B(T.start, D)), He = B(T.end, D), Ue = Math.min(r, He <= Y ? Y + 15 : He);
        if (Ue <= h || Y >= r) return f;
        const Ye = u(Y), Ft = Math.max(u(Ue) - Ye, w);
        return d`
                        <div
                          class="ev rev"
                          style="left:${Ye}${m}; width:${Ft}${m};
                                 top:${le * n}px; height:${n}px;
                                 animation-name:${this._evAnim}; animation-delay:${k * pe}ms;
                                 ${ge(this._colorForEvent(T), this._minContrast)}"
                          @click=${() => this._pickEvent(T)}
                        >
                          <div class="ev-in">
                            <div class="ev-name">${T.summary}</div>
                            <div class="ev-time">
                              ${this._fmtTime(T.start)} – ${this._fmtTime(T.end)}
                            </div>
                          </div>
                        </div>
                      `;
      })}
                  </div>
                `;
    })}
            </div>
          </div>
        </div>
        ${this._hThumb ? d`<div
              class="hbar"
              @pointerdown=${(v) => this._barDown(v)}
              @pointermove=${(v) => this._barMove(v)}
              @pointerup=${(v) => this._barUp(v)}
              @pointercancel=${(v) => this._barUp(v)}
            >
              <div
                class="hthumb"
                style="left:${this._hThumb.left}%; width:${this._hThumb.width}%"
              ></div>
            </div>` : f}
      </div>
    `;
  }
  /** Days across the top, time down the left — the calendar shape. */
  _renderColumnsGrid(e, t, i) {
    this._calendarMode === "full" && (i = { start: 0, end: 24 * 60 });
    const s = this._config, n = s.hour_height ?? $.hour_height, a = i.end - i.start, o = Math.round(a / 60 * n), h = e.map((u) => O(t.filter((w) => !w.allDay), u)), r = this._active ? [this._active.entity] : [], l = ht(h, s.lane_mode ?? $.lane_mode, r), c = e.map((u) => O(t.filter((w) => w.allDay), u)), p = c.some((u) => u.length > 0), m = [];
    for (let u = Math.ceil(i.start / 60) * 60; u <= i.end; u += 60) m.push(u);
    const g = e.length;
    return d`
      <div
        class="grid dir-${this._navDir} ${this._receded ? "dimmed" : ""} ${this._editMode ? "editing" : ""}"
        style="--cols:${g}; --sub:${l.columns}; --body-h:${o}px"
        @animationend=${() => {
      this._navDir = "none";
    }}
      >
        <div class="hdr">
          <div class="corner"></div>
          ${e.map(
      (u, w) => d`
              <div
                class="dayhead ${w % 2 ? "alt" : ""}"
                @pointerdown=${(x) => this._pressStart(x, u, w, me(this._nowMinutes))}
                @contextmenu=${(x) => {
        this._editMode && x.preventDefault();
      }}
              >
                <span class="dow">${this._fmtDowLong(u)},</span>
                <span class="dnum">${this._fmtDate(u)}</span>
                ${this._press?.idx === w && this._press.kind === "label" ? d`<div class="press-ghost head" style=${this._press.style}></div>` : f}
              </div>
            `
    )}
        </div>

        ${p ? d`
              <div class="allday">
                <div class="gut-lbl">all-day</div>
                ${c.map(
      (u) => d`
                    <div class="ad-cell">
                      ${u.map(
        (w) => d`
                          <div
                            class="ad"
                            style=${ge(this._colorForEvent(w), this._minContrast)}
                            @click=${() => this._pickEvent(w)}
                          >
                            ${w.summary}
                          </div>
                        `
      )}
                    </div>
                  `
    )}
              </div>
            ` : f}

        <div class="body">
          <div class="lines">
            ${m.map(
      (u) => d`<div class="line" style="top:${kt(u, i)}"></div>`
    )}
          </div>
          <div class="gutter">
            ${m.map(
      (u) => d`<div class="hr" style="top:${kt(u, i)}">${this._fmtHour(u)}</div>`
    )}
          </div>
          ${e.map(
      (u, w) => this._renderDay(u, w, l.days[w], l.columns, i, o)
    )}
        </div>
      </div>
    `;
  }
  _renderDay(e, t, i, s, n, a) {
    const o = n.end - n.start, h = j(e).getTime();
    return d`
      <div
        class="day ${t % 2 ? "alt" : ""}"
        @pointerdown=${(r) => this._pressStart(r, e, t, {
      axis: "y",
      start: n.start,
      span: o,
      kind: "slot",
      // No minimum height, for the reason the rows grid has no minimum
      // width: the ghost is the slot, not a block.
      ghost: (l, c) => `top:${(l - n.start) / o * a}px;
               height:${(c - l) / o * a}px;
               left:0; width:100%`
    })}
        @contextmenu=${(r) => {
      this._editMode && r.preventDefault();
    }}
      >
        ${this._press?.idx === t && this._press.kind === "slot" ? d`<div class="press-ghost" style=${this._press.style}></div>` : f}
        ${i.map(({ ev: r, column: l }) => {
      const c = Math.max(n.start, B(r.start, h)), p = B(r.end, h), m = Math.min(n.end, p <= c ? c + 15 : p);
      if (m <= n.start || c >= n.end) return f;
      const g = (c - n.start) / o * a, u = Math.max(Wi, (m - c) / o * a), w = this._colorForEvent(r), x = u < 46;
      return d`
            <div
              class="ev ${x ? "compact" : ""} ${this._selected?.key === r.key ? "sel" : ""}"
              style="top:${g}px; height:${u}px;
                     left:calc(${l} * (100% / ${s}));
                     width:calc(100% / ${s});
                     animation-name:${this._evAnim}; animation-delay:${t * pe}ms;
                     ${ge(w, this._minContrast)}"
              @click=${() => this._pickEvent(r)}
            >
              <div class="ev-in">
                <div class="ev-name">${r.summary}</div>
                ${x ? f : d`<div class="ev-time">
                      ${this._fmtTime(r.start)} – ${this._fmtTime(r.end)}
                    </div>`}
              </div>
            </div>
          `;
    })}
      </div>
    `;
  }
  /**
   * Narrow fallback. Deliberately minimal for v0.1.0 — the phone design is a
   * later pass; this exists so the card is not broken when it lands on one.
   */
  _renderList(e, t) {
    let i = 0;
    const s = me(this._nowMinutes);
    return d`
      <div
        class="list ${this._receded ? "dimmed" : ""} ${this._editMode ? "editing" : ""} dir-${this._navDir}"
        @animationend=${() => {
      this._navDir = "none";
    }}
      >
        ${e.map((n, a) => {
      const o = O(t, n).sort(
        (h, r) => h.start.getTime() - r.start.getTime()
      );
      return d`
            <div class="ld">
              <div
                class="ld-head ${N(n, this._now) ? "today" : ""}"
                @pointerdown=${(h) => this._pressStart(h, n, a, s)}
                @contextmenu=${(h) => {
        this._editMode && h.preventDefault();
      }}
              >
                <!-- The row lives in an inner box so the heading itself is a
                     plain block: an absolutely positioned child of a FLEX
                     container does not resolve inset:0 against the padding box
                     here, and the overlay came up 6px short of the heading it
                     is supposed to cover. -->
                <span class="ld-head-in">
                  <span class="dow">${this._fmtDowLong(n)},</span>
                  <span class="dnum">${this._fmtDate(n)}</span>
                </span>
                ${this._press?.idx === a && this._press.kind === "label" ? d`<div class="press-ghost head" style=${this._press.style}></div>` : f}
              </div>
              ${o.length ? o.map(
        (h) => d`
                      <div
                        class="lr"
                        style="animation-name:${this._evAnim};
                               animation-delay:${Math.min(
          i++ * Hi,
          Ui
        )}ms"
                        @click=${() => this._pickEvent(h)}
                      >
                        <span class="lr-bar" style="background:${this._colorForEvent(h)}"></span>
                        <span class="lr-time">
                          ${h.allDay ? "all day" : d`${this._fmtTime(h.start)}<br />${this._fmtTime(h.end)}`}
                        </span>
                        <span class="lr-name">${h.summary}</span>
                      </div>
                    `
      ) : d`<div class="lr empty">Nothing scheduled</div>`}
            </div>
          `;
    })}
      </div>
    `;
  }
  /* ---- the date and time pickers ------------------------------------
   *
   * Built rather than borrowed. `<input type="date">` and `<input type="time">`
   * are small, keyboard-shaped controls that follow the BROWSER's locale, so on
   * this setup they showed 12-hour time inside a card configured for 24 — and on
   * a wall tablet they are close to unusable with a finger.
   *
   * These are the two iOS shapes instead: a month grid for a date, a scrolling
   * drum for a time, both with 44px targets, opened inline under the row rather
   * than in a modal on top of a modal.
   * ------------------------------------------------------------------ */
  /** Snap a wheel column to the row nearest its resting position. */
  _onWheelScroll(e, t, i) {
    const s = e.currentTarget;
    window.clearTimeout(this._wheelTimers[t]), this._wheelTimers[t] = window.setTimeout(() => {
      const n = Math.round(s.scrollTop / V), a = this._draft;
      if (!a) return;
      const [o, h] = (a[i] || "00:00").split(":").map(Number), r = t === "hour" ? Math.min(23, Math.max(0, n)) : o, l = t === "minute" ? Math.min(59, Math.max(0, n)) : h, c = (m) => String(m).padStart(2, "0"), p = `${c(r)}:${c(l)}`;
      p !== a[i] && (i === "startTime" ? this._patchStart({ startTime: p }) : this._patchDraft({ endTime: p }));
    }, 140);
  }
  /** Put every open wheel at its selected row. Called from updated(). */
  /**
   * Send a drum to one row, which is how a MOUSE drives this thing.
   *
   * The wheels were built for a thumb and only ever responded to a drag, which
   * on a desktop leaves a control you have to fling with a trackpad to set a
   * time. Both routes below just scroll the column; the existing debounced
   * scroll handler is what commits the value, so there is one path to the draft
   * however the row was chosen.
   */
  _spinWheel(e, t, i) {
    const s = Math.min(i, Math.max(0, t)) * V;
    e.scrollTo({ top: s, behavior: this._reducedMotion ? "auto" : "smooth" });
  }
  /** One notch of the mouse wheel is one row, over whichever column is hovered. */
  _onWheelTick(e, t) {
    const i = Math.sign(e.deltaY);
    if (!i) return;
    e.preventDefault(), e.stopPropagation();
    const s = e.currentTarget;
    this._spinWheel(s, Math.round(s.scrollTop / V) + i, t);
  }
  _positionWheels() {
    const e = this.renderRoot?.querySelectorAll(".wheel-col");
    if (e?.length)
      for (const t of e) {
        const i = Number(t.dataset.index ?? 0);
        t.scrollTop = i * V;
      }
  }
  _renderWheel(e) {
    const t = this._draft?.[e] ?? "00:00", [i, s] = t.split(":").map(Number), n = [];
    for (let r = 0; r < 24; r++) n.push(r);
    const a = [];
    for (let r = 0; r < 60; r++) a.push(r);
    const o = (r) => String(r).padStart(2, "0"), h = (r) => this._hour12 ? `${r % 12 === 0 ? 12 : r % 12} ${r < 12 ? "AM" : "PM"}` : o(r);
    return d`
      <div class="wheel" style="--wheel-h:${V * Xi}px">
        <div class="wheel-band"></div>
        <div
          class="wheel-col"
          data-index=${i}
          @scroll=${(r) => this._onWheelScroll(r, "hour", e)}
          @wheel=${(r) => this._onWheelTick(r, 23)}
        >
          <div class="wheel-pad"></div>
          ${n.map(
      (r) => d`<div
              class="wheel-item ${r === i ? "sel" : ""}"
              @click=${(l) => this._spinWheel(l.currentTarget.parentElement, r, 23)}
            >
              ${h(r)}
            </div>`
    )}
          <div class="wheel-pad"></div>
        </div>
        <div class="wheel-sep">:</div>
        <div
          class="wheel-col"
          data-index=${s}
          @scroll=${(r) => this._onWheelScroll(r, "minute", e)}
          @wheel=${(r) => this._onWheelTick(r, 59)}
        >
          <div class="wheel-pad"></div>
          ${a.map(
      (r) => d`<div
              class="wheel-item ${r === s ? "sel" : ""}"
              @click=${(l) => this._spinWheel(l.currentTarget.parentElement, r, 59)}
            >
              ${o(r)}
            </div>`
    )}
          <div class="wheel-pad"></div>
        </div>
      </div>
    `;
  }
  _renderCalendar(e, t) {
    const i = this._pickerMonth ?? { y: (/* @__PURE__ */ new Date()).getFullYear(), m: (/* @__PURE__ */ new Date()).getMonth() }, s = new Date(i.y, i.m, 1), n = (s.getDay() + 6) % 7, a = new Date(i.y, i.m + 1, 0).getDate(), o = [];
    for (let m = 0; m < n; m++) o.push(null);
    for (let m = 1; m <= a; m++) o.push(new Date(i.y, i.m, m));
    const h = (m) => String(m).padStart(2, "0"), r = s.toLocaleDateString(this._lang, { month: "long", year: "numeric" }), l = [];
    for (let m = 0; m < 7; m++)
      l.push(new Date(2024, 0, 1 + m).toLocaleDateString(this._lang, { weekday: "narrow" }));
    const c = this._calEpoch % 2 ? "calDayB" : "calDayA", p = this._calDir * 22;
    return d`
      <div class="cal" style="--cal-from:${p}px">
        <div class="cal-head">
          <button class="cal-nav" @click=${() => this._stepMonth(-1)} aria-label="Previous month">
            <ha-icon icon="mdi:chevron-left"></ha-icon>
          </button>
          <span class="cal-month" style="animation-name:${c}">${r}</span>
          <button class="cal-nav" @click=${() => this._stepMonth(1)} aria-label="Next month">
            <ha-icon icon="mdi:chevron-right"></ha-icon>
          </button>
        </div>
        <div class="cal-grid">
          ${l.map((m) => d`<div class="cal-dow">${m}</div>`)}
          ${o.map((m, g) => {
      const u = Math.floor(g / 7) * 26;
      if (!m) return d`<div></div>`;
      const w = `${m.getFullYear()}-${h(m.getMonth() + 1)}-${h(m.getDate())}`;
      return d`
              <button
                class="cal-day ${w === e ? "sel" : ""} ${N(m, this._now) ? "today" : ""}"
                style="animation-name:${c}; animation-delay:${u}ms"
                @click=${() => {
        t(w), this._closePicker();
      }}
              >
                ${m.getDate()}
              </button>
            `;
    })}
        </div>
      </div>
    `;
  }
  /**
   * A foldable group: a header row with a chevron, and content that springs.
   *
   * The content stays MOUNTED and is collapsed rather than removed. Lit dropping
   * it would make opening and closing instant, with nothing to animate — the
   * same reason the all-day time chip is collapsed instead of conditional.
   */
  _renderFold(e, t, i, s, n, a = !1) {
    return d`
      <div class="ed-group">
        <button
          class="ed-row ed-disclose"
          aria-expanded=${i ? "true" : "false"}
          @click=${() => {
      s(), this._confirmDelete = !1;
    }}
        >
          <span class="ed-lbl">${e}</span>
          <span class="ed-sub">${t}</span>
          <ha-icon class="ed-chev ${i ? "open" : ""}" icon="mdi:chevron-down"></ha-icon>
        </button>
        <div class="ed-fold ${i ? "open" : ""} ${a ? "tall" : ""}">
          <div class="ed-fold-in">${n}</div>
        </div>
      </div>
    `;
  }
  /** A panel is on screen while it is open, and while it is collapsing away. */
  _showPicker(e) {
    return this._openPicker === e || this._pickerClosing === e;
  }
  /** One row of the form whose value opens a picker under it. */
  _renderPickerRow(e, t, i) {
    const s = this._draft, n = /* @__PURE__ */ new Date(`${s[t]}T00:00`), a = Number.isNaN(n.getTime()) ? s[t] : n.toLocaleDateString(this._lang, { weekday: "short", day: "numeric", month: "short" }), o = this._hour12 ? (/* @__PURE__ */ new Date(`2000-01-01T${s[i]}`)).toLocaleTimeString(this._lang, {
      hour: "numeric",
      minute: "2-digit"
    }) : s[i];
    return d`
      <div class="ed-row">
        <span class="ed-lbl">${e}</span>
        <span class="ed-vals picks">
          <button
            class="ed-chip ${this._openPicker === t ? "on" : ""}"
            @click=${() => this._togglePicker(t)}
          >
            ${a}
          </button>
          <!-- Kept in the DOM when all-day is on, not removed. Lit dropping the
               element would give an instant disappearance and nothing to animate
               back in; collapsing it lets both directions spring. -->
          <button
            class="ed-chip time ${s.allDay ? "gone" : ""} ${this._openPicker === i ? "on" : ""}"
            tabindex=${s.allDay ? "-1" : "0"}
            aria-hidden=${s.allDay ? "true" : "false"}
            @click=${() => {
      s.allDay || this._togglePicker(i);
    }}
          >
            <span class="chip-in">${o}</span>
          </button>
        </span>
      </div>
      ${this._showPicker(t) ? d`<div class="ed-picker" data-field=${t}>
            ${this._renderCalendar(
      s[t],
      (h) => t === "startDate" ? this._patchStart({ startDate: h }) : this._patchDraft({ endDate: h })
    )}
          </div>` : f}
      ${this._showPicker(i) && !s.allDay ? d`<div class="ed-picker" data-field=${i}>
            ${this._renderWheel(i)}
          </div>` : f}
    `;
  }
  /* ---- location lookup ---------------------------------------------- */
  /**
   * Search as the user types, debounced, with the previous request dropped.
   *
   * Aborting matters more than the debounce does: without it a slow answer for
   * "gym" can land after a fast one for "gymnastika praha" and replace the good
   * suggestions with stale ones.
   */
  _searchLocation(e) {
    if (this._patchDraft({ location: e }), this._placeTimer && clearTimeout(this._placeTimer), this._placeAbort?.abort(), e.trim().length < Nt) {
      this._places = [], this._placesBusy = !1;
      return;
    }
    this._placesBusy = !0, this._placeTimer = setTimeout(() => {
      const t = new AbortController();
      this._placeAbort = t;
      const i = this.hass?.states?.["zone.home"]?.attributes;
      pt(e, {
        lat: typeof i?.latitude == "number" ? i.latitude : void 0,
        lon: typeof i?.longitude == "number" ? i.longitude : void 0,
        lang: this._lang?.split("-")[0],
        signal: t.signal
      }).then((s) => {
        t.signal.aborted || (this._places = s, this._placesBusy = !1);
      });
    }, 320);
  }
  /**
   * Choosing a suggestion fills the field and stops there.
   *
   * It used to open the map as well, which is an interruption: picking from the
   * list IS the answer, and the map is for the times it is not. The coordinates
   * are kept, so opening the map afterwards starts in the right place without
   * having to geocode the text again.
   */
  _pickPlace(e) {
    this._patchDraft({ location: e.label }), this._places = [], this._mapPoint = { lat: e.lat, lon: e.lon }, this._mapWanted = !0;
  }
  /**
   * Borrow Home Assistant's Leaflet, once per session.
   *
   * Called from EVERY path that opens the map — there are two, the map button
   * and picking a suggestion, and having only the button ask for it left the
   * other one showing the static preview for no reason anyone could see.
   */
  async _ensureLeaflet() {
    if (this._leaflet) return;
    const e = await Pi();
    this._leaflet = e, this._leafletOk = !!e;
  }
  /**
   * Show the map for whatever is in the location box.
   *
   * A place picked from the list already has its coordinates. Anything typed by
   * hand, or loaded from an existing event, is only text — so it is geocoded on
   * demand here rather than kept, because Google's event has nowhere to store a
   * latitude and the text is the only thing that survives a save.
   */
  async _toggleMap() {
    if (this._mapOpen) {
      this._mapOpen = !1;
      return;
    }
    if (this._mapOpen = !0, this._mapWanted = !0, await this._ensureLeaflet(), this._mapPoint) return;
    const e = this._draft?.location?.trim();
    if (!e) return;
    this._placesBusy = !0;
    const t = await pt(e, { limit: 1 });
    this._placesBusy = !1, t.length && (this._mapPoint = { lat: t[0].lat, lon: t[0].lon });
  }
  /**
   * The map, interactive where it can be.
   *
   * Leaflet is Home Assistant's own, borrowed at runtime — see loadLeaflet. When
   * it is unavailable the same tiles are laid out statically instead, which
   * still shows WHERE the place is and only loses the panning.
   *
   * The pin does not move: it is fixed to the centre and the MAP moves under it.
   * That is the phone convention, and it avoids asking a finger to hit a 14px
   * target that is also the thing being dragged.
   */
  /* ---- repeat rules -------------------------------------------------- */
  /**
   * Open and close the inline picker panel, in height.
   *
   * Imperative rather than CSS, and height rather than max-height, because the
   * panel is a month grid one time and a pair of drums the next — 330px and
   * 220px — and one max-height covering both means the taller one crawls and
   * the shorter one is over before it starts. Measuring is the only way both
   * land on the same curve.
   *
   * Runs from updated(), which is the first moment the panel exists and has a
   * height to measure.
   */
  _animatePicker() {
    const e = this._pickerClosing;
    if (!e || e === this._openPicker || this._pickerOutField === e) return;
    if (this._reducedMotion) {
      this._pickerClosing = null;
      return;
    }
    const t = this.renderRoot?.querySelector(
      `.ed-picker[data-field="${e}"]`
    );
    if (!t) {
      this._pickerClosing = null;
      return;
    }
    this._pickerOutField = e, this._pickerOutAnim?.cancel();
    const i = t.animate(
      [
        { height: `${t.scrollHeight}px`, opacity: 1, transform: "none" },
        { height: "0px", opacity: 0, transform: "translateY(-8px)" }
      ],
      { duration: 240, easing: "cubic-bezier(0.4, 0, 0.9, 1)", fill: "forwards" }
    );
    this._pickerOutAnim = i, i.finished.then(() => {
      this._pickerOutAnim === i && (this._pickerOutField = null, this._pickerClosing = null);
    }).catch(() => {
    });
  }
  /**
   * Animate the "Repeat every" row through a reflow.
   *
   * "week" becoming "weeks" makes that button wider, which makes the group
   * wider, which — the group being right-aligned — shoves the stepper left. All
   * of it landed in one frame.
   *
   * Widths are what is animated, NOT positions. Animate a translate and the
   * boxes glide while the container's border snaps to its new size around them;
   * animate the widths and the layout does the rest for free, so the stepper
   * slides left because the thing beside it is genuinely growing.
   *
   * Only the BUTTONS are animated. The .seg around them is inline-flex and
   * sizes to its contents, so it follows them frame by frame; animating it as
   * well gave it a width of its own that disagreed with the sum of its children
   * mid-flight, and the row jolted back into line at the end.
   *
   * Call _flipCapture BEFORE the state change; updated() plays it after.
   */
  _flipCapture() {
    if (this._reducedMotion) {
      this._flipFrom = null;
      return;
    }
    const e = this.renderRoot?.querySelector(".rec-every");
    e && (this._flipFrom = [...e.querySelectorAll(".seg-btn")].map((t) => ({
      el: t,
      w: t.getBoundingClientRect().width
    })));
  }
  _flipPlay() {
    const e = this._flipFrom;
    if (e) {
      this._flipFrom = null;
      for (const { el: t, w: i } of e) {
        if (!t.isConnected) continue;
        const s = t.getBoundingClientRect().width;
        Math.abs(s - i) < 0.5 || t.animate(
          // An EMPTY final keyframe means "whatever the layout says", so it lands
          // on the natural width instead of a measured one a fraction of a pixel
          // away from it. A measured endpoint is a guaranteed hop on the last
          // frame, which is exactly what a re-alignment jolt looks like.
          [{ width: `${i}px` }, {}],
          {
            duration: 380,
            // NOT the spring. Overshooting a WIDTH makes the row bulge past where
            // it is going and come back, and four buttons overshooting by four
            // different amounts is a wobble, not a settle.
            easing: "cubic-bezier(0.32, 0.72, 0, 1)",
            fill: "none"
          }
        );
      }
    }
  }
  /** Step the month, with the direction the grid should slide from. */
  _stepMonth(e) {
    const t = this._pickerMonth ?? { y: this._now.getFullYear(), m: this._now.getMonth() };
    this._pickerMonth = { y: t.y, m: t.m + e }, this._calDir = e, this._calEpoch++;
  }
  /**
   * The colour the whole form is accented with.
   *
   * Follows the colour PICKER rather than the event it was opened from, so a
   * new event has an accent before it exists and changing the colour shows at
   * once. For an existing event the two agree: colorId was read off the same
   * map _colorForEvent resolves through.
   */
  get _draftAccent() {
    const e = this._draft;
    return e ? e.colorId ? ue.find(([t]) => t === e.colorId)?.[1] ?? this._colorFor(e.entity) : this._colorFor(e.entity) : "var(--ssc-fg)";
  }
  /**
   * An event's repeat rule in words, or '' when there is nothing to say.
   *
   * '' covers three different cases on purpose — a one-off, a rule this card
   * cannot model, and a malformed one — because the answer on screen is the
   * same for all three: say nothing rather than something half-true.
   */
  _repeatWords(e) {
    const t = ct(this._seriesRule(e));
    return t ? de(t, e.start, this._lang) : "";
  }
  /**
   * The repeat rule of the series this event belongs to.
   *
   * A singly-modified occurrence is DETACHED from its series, and Home
   * Assistant sends it with no rule at all — measured, five of thirty-two on a
   * real school week. The series still has one, and every other occurrence
   * carries it, so a sibling sharing the uid is asked instead. Without this the
   * card says "Weekly on Monday" about most of a series and nothing about the
   * one lesson somebody moved, which reads as that lesson not repeating.
   */
  _seriesRule(e) {
    if (e.rrule) return e.rrule;
    if (e.uid)
      return this._subs.events.find((t) => t.uid === e.uid && t.rrule)?.rrule;
  }
  /** The draft's start as a Date, which every repeat label is generated from. */
  get _draftStart() {
    const e = this._draft, t = /* @__PURE__ */ new Date(`${e?.startDate ?? ""}T${e?.allDay ? "00:00" : e?.startTime ?? "00:00"}`);
    return Number.isNaN(t.getTime()) ? new Date(this._now) : t;
  }
  /** Open the custom window on a working copy, seeded from whatever is set. */
  _openCustom() {
    const e = this._draftStart;
    this._custom = this._draft?.repeat ? { ...this._draft.repeat, byDay: [...this._draft.repeat.byDay] } : {
      freq: "WEEKLY",
      interval: 1,
      byDay: [P[e.getDay()]],
      end: { kind: "never" }
    }, this._openPicker = null, this._pickerClosing = null, this._endsOpen = !1, clearTimeout(this._customCloseTimer), this._customClosing = !1, this._customOpen = !0;
  }
  _patchCustom(e) {
    this._custom && (this._custom = this._namedDays({ ...this._custom, ...e }, this._draftStart));
  }
  /**
   * A weekly rule always names its days, even when RFC 5545 does not require it.
   *
   * FREQ=WEEKLY with no BYDAY means "the day DTSTART falls on", so it is
   * equivalent to naming that day — but only one of the two survives a trip
   * through the unit picker, because normalise() clears byDay whenever the
   * frequency is not weekly. Wandering weeks to months and back therefore
   * turned BYDAY=MO into nothing, and the form then believed the rule had
   * changed when the user had put it back exactly as they found it.
   *
   * Filling it in at both ends — when the rule is seeded and whenever it is
   * touched — makes that round trip lossless.
   */
  _namedDays(e, t) {
    return !e || e.freq !== "WEEKLY" || e.byDay.length ? e : { ...e, byDay: [P[t.getDay()]] };
  }
  /**
   * Whether this edit moves the repeat rule, which is the thing that decides
   * what scopes are even legal — see _renderEditor.
   */
  get _repeatMoved() {
    const e = this._draft;
    return !e || e.isNew ? !1 : !Lt(e.repeat, e.repeatWas);
  }
  /**
   * Set the repeat rule, moving the scope with it when it has to.
   *
   * A repeat rule belongs to the SERIES: Google has no way to give one
   * occurrence a rule of its own, and a PATCH that tries is rejected. So
   * changing the rule takes "This event" off the table, and the form moves the
   * choice to "All events" rather than letting a save fail on it later.
   */
  _setRepeat(e) {
    this._patchDraft({ repeat: e }), this._repeatMoved && this._scope === "instance" && (this._scope = "series");
  }
  /** What the folded Ends row says when it is shut. */
  get _endsSummary() {
    const e = this._custom?.end;
    if (!e || e.kind === "never") return "Never";
    if (e.kind === "after")
      return `After ${e.count} occurrence${e.count === 1 ? "" : "s"}`;
    const t = /* @__PURE__ */ new Date(`${e.date}T00:00`);
    return `On ${Number.isNaN(t.getTime()) ? e.date : t.toLocaleDateString(this._lang, { year: "numeric", month: "short", day: "numeric" })}`;
  }
  /**
   * The repeat options: Google's six, then Custom.
   *
   * Radio rows rather than a dropdown. The card already speaks in rows — the
   * recurrence scope above it is the same control — and a native select on a
   * wall tablet opens the browser's own list, at the browser's own size, in the
   * browser's own locale.
   */
  _renderRepeat() {
    const e = this._draft, t = this._draftStart, i = $i(e.repeat, t, this._lang), s = [
      ...Pt(t, this._lang).map((n) => ({
        key: n.key,
        label: n.label,
        pick: () => this._setRepeat(n.rule)
      })),
      {
        key: "custom",
        label: i === "custom" ? de(e.repeat, t, this._lang) : "Custom…",
        pick: () => this._openCustom()
      }
    ];
    return d`
      ${s.map(
      (n) => d`
          <button
            class="ed-row scope ${i === n.key ? "sel" : ""}"
            role="radio"
            aria-checked=${i === n.key ? "true" : "false"}
            @click=${n.pick}
          >
            <span class="ed-lbl">${n.label}</span>
            ${n.key === "custom" ? d`<ha-icon class="ed-chev" icon="mdi:tune-variant"></ha-icon>` : d`<span class="radio"><span class="radio-dot"></span></span>`}
          </button>
        `
    )}
    `;
  }
  /**
   * −/+ around a number, at a size a finger can hit.
   *
   * The current value arrives as a GETTER, not a number: two taps inside one
   * frame would otherwise both read the value this render captured and land on
   * the same result, because the re-render between them has not happened yet.
   */
  _renderStepper(e, t, i, s, n, a = !0) {
    const o = e(), h = (r) => Math.min(i, Math.max(t, r));
    return d`
      <span class="stepper ${a ? "on" : ""}">
        <button
          class="st-btn"
          aria-label=${`One fewer ${n}`}
          ?disabled=${o <= t}
          @click=${() => s(h(e() - 1))}
        >
          <ha-icon icon="mdi:minus"></ha-icon>
        </button>
        <input
          class="st-val"
          type="text"
          inputmode="numeric"
          aria-label=${n}
          .value=${String(o)}
          @change=${(r) => {
      const l = parseInt(r.target.value, 10);
      s(Number.isFinite(l) ? h(l) : o);
    }}
        />
        <button
          class="st-btn"
          aria-label=${`One more ${n}`}
          ?disabled=${o >= i}
          @click=${() => s(h(e() + 1))}
        >
          <ha-icon icon="mdi:plus"></ha-icon>
        </button>
      </span>
    `;
  }
  /**
   * The custom recurrence window.
   *
   * Google's dialog, in this card's language: every row of it is a control that
   * already exists elsewhere in the form, so it inherits the 44px targets and
   * the springs rather than introducing a third idiom.
   *
   * Nothing here touches the draft until Done. Cancel is free, and a half-built
   * rule — "every 2 weeks on no days at all" — never reaches it.
   */
  _renderCustomModal() {
    if (!this._customOpen && !this._customClosing || !this._custom) return f;
    const e = this._custom, t = [
      ["DAILY", e.interval === 1 ? "day" : "days"],
      ["WEEKLY", e.interval === 1 ? "week" : "weeks"],
      ["MONTHLY", e.interval === 1 ? "month" : "months"],
      ["YEARLY", e.interval === 1 ? "year" : "years"]
    ], i = this._draftStart, s = e.end.kind === "on" ? e.end.date : this._defaultUntil, n = e.end.kind === "after" ? e.end.count : 13, a = (/* @__PURE__ */ new Date(`${s}T00:00`)).toLocaleDateString(this._lang, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
    return d`
      <div class="recwrap ${this._customClosing ? "out" : ""}">
        <!-- The accent is set HERE as well as on the sheet: this window is a
             SIBLING of it, not a child, so it inherits nothing from it. Without
             this the chosen day painted itself dark-on-nothing and vanished. -->
        <div
          class="recmodal"
          style="--accent:${this._draftAccent}"
          @click=${(o) => o.stopPropagation()}
          @touchstart=${(o) => this._onDragStart(o)}
          @touchmove=${(o) => this._onDragMove(o)}
          @touchend=${(o) => this._onDragEnd(o)}
          @touchcancel=${(o) => this._onDragEnd(o)}
        >
        <div class="mm-head">
          <span class="mm-title">Custom recurrence</span>
          <button class="mm-close" aria-label="Close" @click=${() => this._closeCustom(!1)}>
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
        <div class="rec-body">
          <div class="ed-row rec-every">
            <span class="ed-lbl">Repeat every</span>
            <span class="ed-vals">
              ${this._renderStepper(
      () => this._custom?.interval ?? 1,
      1,
      99,
      (o) => {
        this._flipCapture(), this._patchCustom({ interval: o });
      },
      "interval"
    )}
              <span class="seg">
                ${t.map(
      ([o, h]) => d`
                    <button
                      class="seg-btn ${e.freq === o ? "on" : ""}"
                      @click=${() => {
        this._flipCapture(), this._patchCustom({ freq: o });
      }}
                    >
                      ${h}
                    </button>
                  `
    )}
              </span>
            </span>
          </div>

          <!-- Collapsed rather than dropped when it does not apply, so switching
               to weeks and back springs instead of jumping. -->
          <div class="rec-days ${e.freq === "WEEKLY" ? "open" : ""}">
            <div class="rec-days-in">
              <div class="ed-head">Repeat on</div>
              <div class="dow-row">
                ${ie.map((o, h) => {
      const r = e.byDay.includes(o), l = new Date(2024, 0, 1 + h).toLocaleDateString(this._lang, {
        weekday: "narrow"
      });
      return d`
                    <button
                      class="dow-btn ${r ? "on" : ""}"
                      aria-pressed=${r ? "true" : "false"}
                      @click=${() => {
        const c = r ? e.byDay.filter((p) => p !== o) : [...e.byDay, o];
        this._patchCustom({
          byDay: c.length ? c : [P[i.getDay()]]
        });
      }}
                    >
                      ${l}
                    </button>
                  `;
    })}
              </div>
            </div>
          </div>

          <!-- The one control Google's dialog had that this one did not: a
               monthly series repeats either on a DATE or on a weekday's
               position, and the two are different rules. Without it the card
               could read "the second Monday" but never set or clear it. -->
          <div class="rec-days ${e.freq === "MONTHLY" ? "open" : ""}">
            <div class="rec-days-in">
              <div class="ed-head">Repeat on</div>
              <div class="seg month">
                <button
                  class="seg-btn ${e.byPos ? "" : "on"}"
                  @click=${() => this._patchCustom({ byPos: void 0, byMonthDay: i.getDate() })}
                >
                  ${`day ${e.byMonthDay ?? i.getDate()}`}
                </button>
                <button
                  class="seg-btn ${e.byPos ? "on" : ""}"
                  @click=${() => this._patchCustom({
      byMonthDay: void 0,
      byPos: { pos: Oe(i), day: P[i.getDay()] }
    })}
                >
                  ${`the ${Zi[Oe(i)]} ${new Intl.DateTimeFormat(
      this._lang,
      { weekday: "long" }
    ).format(i)}`}
                </button>
              </div>
            </div>
          </div>

          <!-- Folded like Location and Colour. Most rules never end, so the
               three rows that say how one does are two taps away rather than a
               third of the window; the summary carries the answer when they
               are shut. -->
          ${this._renderFold(
      "Ends",
      this._endsSummary,
      this._endsOpen,
      () => {
        this._endsOpen = !this._endsOpen, this._endsOpen || this._closePicker();
      },
      d`
              <!-- Whole ROWS, not just the dots. The dot is 24px of a 44px row
                   and was the only live part of it, so tapping the obvious
                   place - the word, the date, anywhere across - did nothing. -->
              <button
                class="ed-row scope ${e.end.kind === "never" ? "sel" : ""}"
                role="radio"
                aria-checked=${e.end.kind === "never" ? "true" : "false"}
                @click=${() => {
        this._closePicker(), this._patchCustom({ end: { kind: "never" } });
      }}
              >
                <span class="ed-lbl">Never</span>
                <span class="radio"><span class="radio-dot"></span></span>
              </button>

              <div
                class="ed-row scope ends ${e.end.kind === "on" ? "sel" : ""}"
                role="radio"
                aria-checked=${e.end.kind === "on" ? "true" : "false"}
                @click=${() => this._patchCustom({ end: { kind: "on", date: s } })}
              >
                <span class="ed-lbl">On</span>
                <button
                  class="ed-chip ${this._openPicker === "untilDate" ? "on" : ""}"
                  @click=${(o) => {
        o.stopPropagation(), this._patchCustom({ end: { kind: "on", date: s } }), this._togglePicker("untilDate");
      }}
                >
                  ${a}
                </button>
                <span class="radio"><span class="radio-dot"></span></span>
              </div>
              ${this._showPicker("untilDate") ? d`<div class="ed-picker" data-field="untilDate">
                    ${this._renderCalendar(
        s,
        (o) => this._patchCustom({ end: { kind: "on", date: o } })
      )}
                  </div>` : f}

              <div
                class="ed-row scope ends ${e.end.kind === "after" ? "sel" : ""}"
                role="radio"
                aria-checked=${e.end.kind === "after" ? "true" : "false"}
                @click=${() => {
        this._closePicker(), this._patchCustom({ end: { kind: "after", count: n } });
      }}
              >
                <span class="ed-lbl">After</span>
                <!-- Stopped, and this one MUST be: the row's handler would run
                     after the step and write the count back as it was. -->
                <span class="stop" @click=${(o) => o.stopPropagation()}>
                  ${this._renderStepper(
        () => this._custom?.end.kind === "after" ? this._custom.end.count : n,
        1,
        999,
        (o) => this._patchCustom({ end: { kind: "after", count: o } }),
        "occurrences",
        e.end.kind === "after"
      )}
                </span>
                <span class="ed-sub occ">occurrences</span>
                <span class="radio"><span class="radio-dot"></span></span>
              </div>
            `,
      // Only while the month grid is actually inside it. max-height is a
      // CEILING, and one four times the content's height opens the clip
      // in a quarter of the time — the three rows on their own snapped
      // open in 80ms of a 360ms move.
      this._showPicker("untilDate")
    )}

          <div class="rec-says">${de(e, i, this._lang)}</div>
        </div>
        <div class="mm-foot">
          <span class="mm-addr"></span>
          <button class="ed-btn small" @click=${() => this._closeCustom(!1)}>Cancel</button>
          <button class="ed-btn primary small" @click=${() => this._closeCustom(!0)}>
            Done
          </button>
        </div>
        </div>
      </div>
    `;
  }
  /**
   * Close the custom window, keeping it on screen for the length of its exit.
   *
   * `apply` is the difference between Done and Cancel, and it is the only one:
   * the rule was being edited on a copy, so walking away from it costs nothing.
   */
  _closeCustom(e) {
    if (this._customOpen) {
      if (e && this._setRepeat(this._custom), this._customOpen = !1, this._openPicker = null, this._pickerClosing = null, clearTimeout(this._customCloseTimer), this._reducedMotion) {
        this._custom = null;
        return;
      }
      this._customClosing = !0, this._customCloseTimer = setTimeout(() => {
        this._customClosing = !1, this._custom = null;
      }, 200);
    }
  }
  /** Teardown, for the paths where the whole form is going away anyway. */
  _cancelCustom() {
    clearTimeout(this._customCloseTimer), this._customOpen = !1, this._customClosing = !1, this._custom = null, this._openPicker = null, this._pickerClosing = null;
  }
  /** A year out, which is where Google's own "On" date starts. */
  get _defaultUntil() {
    const e = this._draftStart;
    return e.setFullYear(e.getFullYear() + 1), R(e).date;
  }
  /**
   * The location picker, as a window of its own.
   *
   * It was a 505x360 panel wedged into the edit form, and at that size you
   * cannot get your bearings, let alone find a side entrance — the user's word
   * for it was "useless", and they were right. Choosing a place on a map is its
   * own task and it gets the whole screen.
   *
   * Tapping picks, immediately, and the field behind updates as you go. The
   * button says Done rather than "use this location" because the choice was
   * already made by the tap; this only closes the window.
   */
  _renderMapModal() {
    if (!this._mapOpen) return f;
    const e = this._mapPoint;
    return d`
      <link rel="stylesheet" href=${Ci} />
      <div class="mapmodal" @click=${(t) => t.stopPropagation()}>
        <div class="mm-head">
          <span class="mm-title">Choose a location</span>
          <button class="mm-close" aria-label="Close" @click=${() => this._mapOpen = !1}>
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
        <div class="mm-body">
          ${e ? this._leafletOk ? d`
                  <div class="map live">
                    <div class="map-canvas"></div>
                    <span class="map-credit">${ut[this._baseMap].attribution}</span>
                  </div>
                ` : (
      // Leaflet could not be borrowed. Still shows WHERE the place is,
      // just without panning — better than an empty window.
      d`
                  <div class="map static-fallback" style="--map-h:340px">
                    ${(() => {
        const { base: t, labels: i } = Oi(e.lat, e.lon, 16, 520, 340, "Light"), s = (n) => d`<img src=${n.url} alt="" style="left:${n.left}px; top:${n.top}px" />`;
        return d`
                        <div class="map-layer">${t.map(s)}</div>
                        <div class="map-layer labels">${i.map(s)}</div>
                        <div class="map-pin"></div>
                      `;
      })()}
                  </div>
                `
    ) : d`<div class="map-none">
                ${this._placesBusy ? "Looking that up…" : "Search for an address first, or open this from a place that has one."}
              </div>`}
        </div>
        <div class="mm-foot">
          <span class="mm-addr">${this._draft?.location || "Tap the map to pick a place."}</span>
          <a
            class="ed-btn small"
            href=${Ni(this._draft?.location ?? "", e?.lat, e?.lon)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ha-icon icon="mdi:open-in-new"></ha-icon>
          </a>
          <button class="ed-btn primary small" @click=${() => this._mapOpen = !1}>Done</button>
        </div>
      </div>
    `;
  }
  /**
   * Build the Leaflet map once its container is in the DOM, or tear it down.
   *
   * Called from updated(), because the container only exists after a render and
   * Leaflet measures it on construction — building it earlier gives a map that
   * thinks it is 0x0 and renders one tile in the corner.
   */
  _syncLeaflet() {
    const e = this._mapOpen && !!this._mapPoint && this._leafletOk, t = this.renderRoot?.querySelector(".map-canvas");
    if (!e || !t) {
      this._leafletMap && (this._leafletMap.remove(), this._leafletMap = null, this._leafletMarker = null);
      return;
    }
    if (this._leafletMap) {
      this._mapWanted && (this._mapWanted = !1, this._leafletMap.setView([this._mapPoint.lat, this._mapPoint.lon], 16), this._leafletMarker?.setLatLng([this._mapPoint.lat, this._mapPoint.lon])), this._leafletMap.invalidateSize();
      return;
    }
    const i = this._leaflet;
    if (!i) return;
    const s = i.map(t, {
      attributionControl: !1,
      zoomControl: !0,
      scrollWheelZoom: !0,
      tap: !0
    }).setView([this._mapPoint.lat, this._mapPoint.lon], 16);
    this._applyBaseMap(s, i);
    const n = i.marker([this._mapPoint.lat, this._mapPoint.lon], {
      draggable: !0,
      keyboard: !1,
      icon: i.divIcon({
        className: "ssc-pin",
        html: "<span></span>",
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      })
    }).addTo(s);
    n.on("dragend", () => {
      const a = n.getLatLng();
      this._pickAt(a.lat, a.lng);
    }), s.on("click", (a) => {
      n.setLatLng(a.latlng), this._pickAt(a.latlng.lat, a.latlng.lng);
    }), this._leafletMarker = n, this._leafletMap = s, setTimeout(() => s.invalidateSize(), 120);
  }
  /**
   * Put the chosen basemap on the map, replacing whatever was there.
   *
   * Drawn at full strength: the earlier version darkened the tiles to match the
   * card, which on an already-sparse basemap left almost nothing visible. A map
   * you cannot read is not worth matching the furniture.
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  _applyBaseMap(e, t) {
    for (const a of this._baseLayers) e.removeLayer(a);
    this._baseLayers = [];
    const i = ut[this._baseMap], s = { maxNativeZoom: i.maxNativeZoom, maxZoom: 19 }, n = t.tileLayer(i.url, s).addTo(e);
    this._baseLayers.push(n), i.overlay && this._baseLayers.push(t.tileLayer(i.overlay, s).addTo(e));
  }
  /**
   * Point at something and it becomes the location.
   *
   * Straight into the field, with no confirmation step: the tap already said
   * which place, and a second button asking "really?" is the thing that made the
   * first version of this useless. The field is a text box — if the answer is
   * wrong, typing over it is right there.
   */
  async _pickAt(e, t) {
    this._mapPickSeq === void 0 && (this._mapPickSeq = 0);
    const i = ++this._mapPickSeq;
    this._mapPoint = { lat: e, lon: t };
    const s = await Li(e, t, { lang: this._lang?.split("-")[0] });
    i !== this._mapPickSeq || !s || (this._patchDraft({ location: s.label }), this._places = []);
  }
  /** All-day on or off, closing any time wheel that no longer applies. */
  _setAllDay(e) {
    e && (this._openPicker === "startTime" || this._openPicker === "endTime") && this._closePicker(), this._patchDraft({ allDay: e });
  }
  /**
   * The edit form.
   *
   * iOS-shaped — a grouped list of labelled rows, then the actions — but square,
   * because this card has no rounded corners anywhere and one rounded box would
   * look like a mistake rather than a flourish.
   *
   * Nothing here writes until Save is pressed. The draft is a copy, so Cancel is
   * genuinely free and a re-render mid-typing cannot rebind the form to a
   * different event.
   */
  _renderEditor() {
    const e = this._draft;
    if (!e) return f;
    const t = this._draftAccent, i = [
      ["instance", "This event"],
      ["future", "This and future"],
      ["series", "All events"]
    ];
    return d`
      <div
        class="scrim"
        @click=${() => {
      this._customOpen ? this._closeCustom(!1) : this._mapOpen ? this._mapOpen = !1 : this._closeEditor();
    }}
      >
        ${this._renderMapModal()} ${this._renderCustomModal()}
        <div
          class="sheet editor ${this._mapOpen || this._customOpen ? "behind" : ""}"
          style="--accent:${t}"
          @click=${(s) => s.stopPropagation()}
          @touchstart=${(s) => this._onDragStart(s)}
          @touchmove=${(s) => this._onDragMove(s)}
          @touchend=${(s) => this._onDragEnd(s)}
          @touchcancel=${(s) => this._onDragEnd(s)}
        >
          <input
            class="ed-title"
            .value=${e.summary}
            placeholder=${e.isNew ? "New event" : "Title"}
            aria-label="Title"
            @input=${(s) => this._patchDraft({ summary: s.target.value })}
          />

          <div class="ed-group">
            <label class="ed-row">
              <span class="ed-lbl">All-day</span>
              <input
                type="checkbox"
                class="ed-check"
                .checked=${e.allDay}
                @change=${(s) => this._setAllDay(s.target.checked)}
              />
            </label>
            ${this._renderPickerRow("Starts", "startDate", "startTime")}
            ${this._renderPickerRow("Ends", "endDate", "endTime")}
          </div>

          ${e.recurring ? d`
                <div class="ed-group">
                  <div class="ed-head">Applies to</div>
                  ${i.map(
      ([s, n]) => d`
                      <button
                        class="ed-row scope ${this._scope === s ? "sel" : ""} ${s === "instance" && this._repeatMoved ? "off" : ""}"
                        role="radio"
                        aria-checked=${this._scope === s ? "true" : "false"}
                        ?disabled=${s === "instance" && this._repeatMoved}
                        @click=${() => {
        this._scope = s, this._confirmDelete = !1;
      }}
                      >
                        <span class="ed-lbl">${n}</span>
                        <!-- A drawn radio, not the native one: accent-color can
                             paint it but nothing can animate it, and the dot
                             springing in is the whole point here. -->
                        <span class="radio"><span class="radio-dot"></span></span>
                      </button>
                    `
    )}
                  <!-- Three separate branches rather than one interpolated
                       string, so Lit builds a NEW element per scope and the
                       entry animation actually re-runs. Swapping the text inside
                       one element changes nothing a CSS animation can see. -->
                  ${this._repeatMoved ? d`<div class="ed-note">
                        A repeat rule belongs to the whole series, so this change cannot apply to
                        one occurrence on its own.
                      </div>` : this._scope === "instance" ? d`<div class="ed-note">Only the occurrence you opened changes.</div>` : this._scope === "future" ? d`<div class="ed-note">
                          This occurrence and every later one. Earlier ones are left alone.
                        </div>` : d`<div class="ed-note">
                          Every occurrence, including ones already past.
                        </div>`}
                </div>
              ` : f}

          <!-- Repeat, colour and details all fold, and all sit after the
               recurrence options: what a change APPLIES TO is the decision with
               consequences, so it comes before the cosmetic ones. Repeat leads
               the three because it is the one that changes how many events
               exist. Hidden only when the event carries a rule this card cannot
               state in words - see canRepeat. -->
          ${e.canRepeat ? this._renderFold(
      "Repeat",
      de(e.repeat, this._draftStart, this._lang),
      this._repeatOpen,
      () => {
        this._repeatOpen = !this._repeatOpen;
      },
      this._renderRepeat()
    ) : f}
          ${this._renderFold(
      "Colour",
      e.colorId ? ue.find(([s]) => s === e.colorId)?.[2] ?? "" : (
        // NOT "Calendar's colour". Clearing an occurrence's own colour
        // makes it inherit its SERIES, which may itself be coloured —
        // measured: a cleared occurrence of a Basil series comes back
        // Basil, not the calendar's pink. The old label promised
        // something the card then visibly did not do.
        "Default"
      ),
      this._colorOpen,
      () => {
        this._colorOpen = !this._colorOpen;
      },
      d`
              <!-- Google's own picker: round swatches in a grid with a tick on
                   the one that is set. -->
              <div class="sw-grid">
                <button
                  class="sw none ${e.colorId === "" ? "sel" : ""}"
                  title="No colour of its own - inherits the series or the calendar"
                  aria-label="No colour of its own - inherits the series or the calendar"
                  @click=${() => this._patchDraft({ colorId: "" })}
                >
                  ${e.colorId === "" ? d`<ha-icon icon="mdi:check"></ha-icon>` : f}
                </button>
                ${ue.map(
        ([s, n, a]) => d`
                    <button
                      class="sw ${e.colorId === s ? "sel" : ""}"
                      style="--sw:${n}"
                      title=${a}
                      aria-label=${a}
                      @click=${() => this._patchDraft({ colorId: s })}
                    >
                      ${e.colorId === s ? d`<ha-icon icon="mdi:check"></ha-icon>` : f}
                    </button>
                  `
      )}
              </div>
            `
    )}
          ${this._renderFold(
      "Details",
      e.location || e.description ? [e.location, e.description].filter(Boolean).join(" · ").slice(0, 40) : "Location, notes",
      this._detailsOpen,
      () => {
        this._detailsOpen = !this._detailsOpen;
      },
      d`
              <div class="ed-row loc">
                <span class="ed-lbl">Location</span>
                <span class="ed-vals">
                  <input
                    type="text"
                    placeholder="Search an address"
                    autocomplete="off"
                    .value=${e.location}
                    @input=${(s) => this._searchLocation(s.target.value)}
                  />
                  <button
                    class="ed-mapbtn ${this._mapOpen ? "on" : ""}"
                    ?disabled=${!e.location.trim()}
                    aria-label="Show on a map"
                    title="Show on a map"
                    @click=${() => void this._toggleMap()}
                  >
                    <ha-icon icon="mdi:map-outline"></ha-icon>
                  </button>
                </span>
              </div>
              <!-- Suggestions sit under the field, not over it: the form is
                   already inside a sheet, and a second floating layer on a phone
                   ends up half off the screen. -->
              ${this._places.length ? d`
                    <div class="loc-list">
                      ${this._places.map(
        (s) => d`
                          <button class="loc-item" @click=${() => this._pickPlace(s)}>
                            <ha-icon icon="mdi:map-marker-outline"></ha-icon>
                            <span class="loc-text">
                              <span class="loc-name">${s.name}</span>
                              ${s.detail ? d`<span class="loc-detail">${s.detail}</span>` : f}
                            </span>
                          </button>
                        `
      )}
                    </div>
                  ` : f}
              <div class="ed-row notes">
                <span class="ed-lbl">Notes</span>
                <textarea
                  rows="2"
                  placeholder="None"
                  .value=${e.description}
                  @input=${(s) => this._patchDraft({ description: s.target.value })}
                ></textarea>
              </div>
            `
    )}

          ${this._editError ? d`<div class="ed-error">${this._editError}</div>` : f}

          <div class="ed-actions">
            <!-- Nothing to delete yet. Cancel is the way out of a new event,
                 and it is already the next button along. -->
            ${e.isNew ? f : d`<button
                  class="ed-btn danger ${this._confirmDelete ? "armed" : ""}"
                  ?disabled=${this._busy}
                  @click=${() => void this._deleteDraft()}
                >
                  ${this._busy && this._confirmDelete ? "Deleting…" : this._confirmDelete ? "Tap again to delete" : "Delete"}
                </button>`}
            <span class="ed-spacer"></span>
            <button class="ed-btn" ?disabled=${this._busy} @click=${() => this._closeEditor()}>
              Cancel
            </button>
            <button
              class="ed-btn primary"
              ?disabled=${this._busy}
              @click=${() => void this._saveDraft()}
            >
              <!-- Silent during a delete: that button is doing the talking,
                   and two buttons announcing different jobs at once is one
                   of them lying. -->
              ${this._busy && !this._confirmDelete ? e.isNew ? "Adding…" : "Saving…" : e.isNew ? "Add" : "Save"}
            </button>
          </div>
        </div>
      </div>
    `;
  }
  _renderSheet() {
    if (this._draft) return this._renderEditor();
    const e = this._selected;
    return e ? d`
      <div class="scrim" @click=${() => this._closeSheet()}>
        <div
          class="sheet"
          style="--accent:${this._colorForEvent(e)}"
          @click=${(t) => t.stopPropagation()}
        >
          <!-- A way out that is not "tap the dark bit". The scrim has always
               closed this, but nothing said so, and on a tablet an unmarked
               dismissal is a guess. -->
          <button class="sh-close" aria-label="Close" @click=${() => this._closeSheet()}>
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
          <div class="sh-name">${e.summary}</div>
          <div class="sh-time">
            ${e.allDay ? `${this._fmtDate(e.start)} · all day` : `${this._fmtDow(e.start)} ${this._fmtDate(e.start)} · ${this._fmtTime(
      e.start
    )} – ${this._fmtTime(e.end)}`}
          </div>
          <div class="sh-cal">
            <span class="dot" style="background:${this._colorFor(e.entity)}"></span>
            ${this._nameFor(e.entity)}
          </div>
          <!-- The repeat rule, which Home Assistant has always sent and this
               card used to throw away. A lesson that looks identical every week
               and one that happens once are the same block until this says
               otherwise. Only for a rule the card can state in words: a raw
               RRULE on screen would be worse than nothing. -->
          ${this._repeatWords(e) ? d`<div class="sh-row repeat">
                <ha-icon icon="mdi:repeat"></ha-icon>
                <span>${this._repeatWords(e)}</span>
              </div>` : f}
          ${e.location ? d`<div class="sh-row">${e.location}</div>` : f}
          ${e.description ? d`<div class="sh-row">${e.description}</div>` : f}
        </div>
      </div>
    ` : f;
  }
  get _lang() {
    return this.hass?.locale?.language;
  }
  /**
   * Home Assistant's own setting wins by default, but a timetable is written in
   * 24h in most of the world regardless of what the rest of the frontend does,
   * and '1:55 PM' does not fit a 45-minute block. `time_format` pins it here
   * without touching the global setting.
   */
  get _hour12() {
    const e = this._config?.time_format ?? $.time_format;
    if (e === "12") return !0;
    if (e === "24") return !1;
    const t = this.hass?.locale?.time_format;
    return t === "12" ? !0 : t === "24" ? !1 : new Intl.DateTimeFormat(this._lang, { hour: "numeric" }).resolvedOptions().hour12 ?? !1;
  }
  /** 24h is built by hand: Intl pads the hour to "08:25" whatever you ask for. */
  _fmtTime(e) {
    return this._hour12 ? new Intl.DateTimeFormat(this._lang, {
      hour: "numeric",
      minute: "2-digit",
      hour12: !0
    }).format(e) : `${e.getHours()}:${xt(e.getMinutes())}`;
  }
  _fmtHour(e) {
    const t = Math.floor(e / 60) % 24;
    if (!this._hour12) return `${t}:${xt(e % 60)}`;
    const i = new Date(2e3, 0, 1, t, e % 60);
    return new Intl.DateTimeFormat(this._lang, { hour: "numeric", hour12: !0 }).format(i);
  }
  _fmtDow(e) {
    return new Intl.DateTimeFormat(this._lang, { weekday: "short" }).format(e);
  }
  _fmtDowLong(e) {
    return new Intl.DateTimeFormat(this._lang, { weekday: "long" }).format(e);
  }
  /** "Sep 7th". The suffix is English-only, so other locales keep a bare number. */
  _fmtDate(e) {
    return `${new Intl.DateTimeFormat(this._lang, { month: "short" }).format(e)} ${e.getDate()}${$s(e.getDate(), this._lang)}`;
  }
};
b.styles = Ut`
    /*
     * Sizing and weight carry the hierarchy here, never colour. Every piece of
     * text is full-strength foreground; what changes between a subject name and
     * its time is size and weight. Grey secondary text was tried and rejected -
     * on a wall tablet at arm's length it simply reads as unreadable rather than
     * as unimportant.
     *
     * The card sits on the THEME's own card background, the same fill every
     * other card in this config uses. An earlier draft floated a translucent
     * white panel on the page background and it came out muddy grey.
     */
    :host {
      /* The card's own inset. Named because the month grid cancels it to reach
         the card's edges - see .mgrid - and the two must not drift apart. */
      --ssc-pad: 18px;
      --ssc-font: system-ui, 'SF Pro Display', 'SF Pro Text', Inter, 'Helvetica Neue', Roboto,
        sans-serif;
      --ssc-fg: var(--primary-text-color, #fff);
      --ssc-line: rgba(255, 255, 255, 0.13);
      --ssc-line-strong: rgba(255, 255, 255, 0.22);
      /* Column banding. Deliberately tiny: it should guide the eye along a row
         without ever reading as two different kinds of day. */
      --ssc-band: rgba(255, 255, 255, 0.042);
      --ssc-gutter: 62px;
      --ssc-spring: cubic-bezier(0.34, 1.42, 0.64, 1);
      --ssc-glide: cubic-bezier(0.22, 1, 0.36, 1);
      /* Week transition. A long, heavily front-loaded ease — most of the
         distance is covered early and it settles slowly, which is what reads as
         iOS rather than as a linear slide. The block cascade uses a gentler
         spring than --ssc-spring: at this duration the sharper one overshoots
         far enough to look like a bounce. */
      /* How far the schedule recedes behind the open calendar menu. Opacity is
         how much is faded OUT: 0.1 leaves a tenth showing, i.e. 90% gone. Lift
         and scale are the fold — the cells drop back and shrink, so they read as
         folding away from the menu rather than merely dimming under it. */
      --ssc-dim-opacity: 0.1;
      --ssc-dim-lift: 18px;
      --ssc-dim-scale: 0.9;
      --ssc-dim-lift-list: 26px;
      --ssc-dim-scale-list: 0.86;
      --ssc-week-ease: cubic-bezier(0.32, 0.72, 0, 1);
      --ssc-week-dur: 560ms;
      --ssc-block-ease: cubic-bezier(0.24, 1.12, 0.4, 1);
      --ssc-block-dur: 620ms;
      /* custom elements default to inline, and inline boxes measure width 0 in a
         ResizeObserver, which would wedge layout auto in list mode */
      display: block;
      font-family: var(--ssc-font);
      color: var(--ssc-fg);
    }
    ha-card {
      background: var(--ha-card-background, var(--card-background-color, #1c1c1e));
      border-radius: 0;
      color: var(--ssc-fg);
      overflow: hidden;
      position: relative;
    }
    .panel {
      padding: var(--ssc-pad);
      box-sizing: border-box;
    }

    .head {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 14px;
      transition:
        transform 260ms var(--ssc-glide),
        opacity 260ms var(--ssc-glide);
    }
    /* The header goes back with the schedule. It used to stay at full strength
       while everything under it receded, which made the sheet look like it had
       opened over half a card. Opacity is safe here where it is not on the day
       panel: there is nothing behind the header but the card itself. */
    .head.dimmed {
      transform: translateY(calc(var(--ssc-dim-lift, 18px) * -0.5));
      opacity: 0.22;
      pointer-events: none;
    }
    /* Buttons and the week range share the right-hand column, the range tucked
       under them, so the heading has the whole left side to itself. */
    .head-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 14px;
      flex: 0 0 auto;
    }
    /* Centred on the CARD, not between its neighbours. As a flex item the
       group would sit wherever the title happened to end, and forcing it with
       equal flex bases on the side groups squashes a long calendar name.
       Taken out of flow it lands on the centre line whatever the sides do. */
    /*
     * Positioned by its LEFT edge, and it slides.
     *
     * The wide case wants the mode button on the card's centre line, which is
     * 50% less half the button group. The narrow case wants the whole thing far
     * enough left that the period clears the nav buttons. clamp() gives both and
     * everything between as ONE continuous movement - the group drifts left as
     * the card narrows instead of sitting pinned to a middle it no longer fits.
     *
     * 652px is the room the group needs to its right at the widest: the button
     * group, its gap, the longest period the card produces, and the tools. It
     * does not depend on the CURRENT month's name, so paging does not move the
     * button - only resizing does.
     */
    .head-centre {
      position: absolute;
      /* Measured, not guessed: the calendar name's button ends 268px from the
         card's left edge, so 280 is the first place this group can stand
         without covering the name it belongs to. */
      left: clamp(280px, calc(100% - 652px), calc(50% - 52px));
      top: 0;
      display: flex;
      align-items: center;
    }
    .mode-toggles {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    /* The period, read rather than operated: big enough to answer "which month
       is this" from across a room, and beside the shape controls instead of
       tucked under the arrows that change it.
       Taken OUT OF FLOW and hung off the LEFT edge of the toggle group, one
       button plus a gap along - so it sits beside the mode button itself rather
       than after the whole group. As a flex sibling its width was part of what
       got centred, so the button slid left and right by a few px every time the
       month name changed length. Out of flow it contributes nothing, and the
       button holds its place whatever the text beside it says. */
    .head-centre .range {
      position: absolute;
      left: calc(44px + 16px);
      margin-top: 0;
      /* Shrinks with the card rather than stepping down at a breakpoint. --ssc-w
         is the card's own measured width; 24px is the tablet, 16px the floor. */
      font-size: clamp(13px, calc(var(--ssc-w, 1400px) * 0.017), 24px);
      font-weight: 600;
      letter-spacing: -0.4px;
      white-space: nowrap;
    }
    .head-centre .range .pill {
      font-size: 15px;
      padding: 4px 10px;
    }
    /* Narrow chrome. The phone LAYOUT is still undesigned, but the header must
       not visibly break while it waits: the title has to fit, and the week pill
       is redundant next to a date range it would otherwise push onto its own
       line. */
    .narrow {
      padding: 13px 13px 14px;
      /* The list's week animation is a 34% slide. Without this it becomes
         page-wide overflow and the phone grows a scrollbar along the bottom
         every time the week changes. */
      overflow-x: hidden;
    }
    /* The phone header WRAPS: the calendar name takes the first row and the
       week nav sits under it. On one row, four 44px buttons leave about 69px
       for the name, which cut a two-word calendar name down to its first - and the
       name is the thing that says whose week you are looking at. Wrapping is
       what lets the buttons stay full size AND the name stay whole. */
    .narrow .head {
      flex-wrap: wrap;
      /* 6px off the shared 14px — the other 6px went onto .head-right's top
         margin, so the block moves down without the header growing. */
      margin-bottom: 6px;
    }
    .narrow .titles {
      flex: 1 1 100%;
    }
    /* Left-aligned once wrapped. Right-aligning a full-width second row put
       the week nav on the opposite side of the card from the calendar name it
       belongs to, with a gap between them; under the name it reads as one
       header block. */
    /* The header wraps on a phone, so the buttons and the week range sit UNDER
       the calendar name rather than beside it. That block is pushed down 12px
       from the name and left only 8px clear of the schedule below (the shared
       .head margin is 14px), so it reads as belonging to the week it labels
       rather than floating between the two. Moving it down without also closing
       the gap underneath would just make the header taller. */
    .narrow .head-right {
      flex: 1 1 100%;
      align-items: flex-start;
      margin-top: 12px;
    }
    .narrow .head-right .range {
      justify-content: flex-start;
    }
    /* First day only, so the gap under the header is controlled by the header's
       own margin-bottom and nothing else. .ld's padding is on every day group,
       so changing it there would move Tuesday away from Monday too. */
    .narrow .list > .ld:first-child {
      padding-top: 0;
    }
    .narrow .pick-btn .pick-name {
      font-size: 20px;
    }
    .narrow .pick-btn .av {
      width: 28px;
      height: 28px;
    }
    .narrow .range {
      font-size: 13px;
      white-space: nowrap;
    }
    .narrow .pill {
      font-size: 12px;
    }
    /* 10% under the grid's 44px. The phone had been at 37px with a 7px gap,
       which quietly undid the tablet sizing pass - .narrow .tools overrode the
       wider gap, so the extra air never reached the list layout and the buttons
       read noticeably smaller than the same controls on the tablet. 40px keeps a
       comfortable thumb target while giving a narrow header back some air. The
       gap stays at the shared 15px, and the calendar NAME absorbs the
       difference by ellipsising. */
    .narrow .btn {
      width: 40px;
      height: 40px;
    }
    .narrow .btn ha-icon {
      --mdc-icon-size: 23px;
    }
    /* A row, so the edit-mode pill can sit beside the calendar name. The picker
       keeps min-width:0 so a long name still ellipsises rather than pushing the
       pill off the card. */
    .titles {
      min-width: 0;
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .head-right .range {
      margin-top: 0;
      justify-content: flex-end;
    }
    .range {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-top: 8px;
      font-size: 15px;
      font-weight: 400;
      letter-spacing: 0;
    }
    /* Avatar, name and chevron are one target. The menu expands with the same
       max-height/opacity move the Protect card's camera strip uses. */
    /* inline-block so the picker is only as wide as its own contents. As a
       block it filled .titles, and the menu's min-width:100% then stretched to
       the whole card. */
    /* inline-block so the menu's min-width:100% measures the BUTTON and not the
       whole header - see the menu rules below. max-width lets it shrink inside
       .titles: without it the picker kept its natural width on a phone, spilled
       out of its flex item and painted over the week-nav buttons (measured as a
       9px overlap on the mobile Schedules view at a 404px card). */
    .picker {
      position: relative;
      display: inline-block;
      max-width: 100%;
      min-width: 0;
    }
    .pick-btn,
    .pick-item {
      display: flex;
      align-items: center;
      min-width: 0;
      max-width: 100%;
      gap: 12px;
      padding: 4px 8px 4px 4px;
      border: none;
      background: transparent;
      color: var(--ssc-fg);
      font: inherit;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease;
    }
    .pick-btn:hover,
    .pick-item:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    /* The name is the part that gives way when the header runs out of room:
       the avatar and chevron stay whole and a long calendar name ellipsises,
       which beats either overlapping the buttons or wrapping the header. */
    .pick-name {
      font-weight: 700;
      white-space: nowrap;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* The heading. There is no separate card title, so this carries that role —
       and matches Home Assistant's own card header exactly, tokens included, so
       it sits at the same weight and size as every other card on the dashboard.
       Notably that is font-weight NORMAL, not bold. */
    .pick-btn .pick-name {
      font-family: var(--ha-card-header-font-family, inherit);
      font-size: var(--ha-card-header-font-size, var(--ha-font-size-2xl, 24px));
      font-weight: var(--ha-font-weight-normal, 400);
      letter-spacing: -0.012em;
      line-height: var(--ha-line-height-condensed, 1.2);
    }
    .pick-btn .av {
      width: 34px;
      height: 34px;
    }
    .pick-btn .av.init {
      font-size: 17px;
    }
    .pick-btn.static {
      cursor: default;
      padding-right: 4px;
    }
    .pick-btn.static:hover {
      background: transparent;
    }
    .pick-item .pick-name {
      font-size: 16px;
      letter-spacing: -0.2px;
    }
    .av {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      object-fit: cover;
      flex: 0 0 auto;
      display: grid;
      place-items: center;
    }
    .av.init {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
    }
    .pick-chev {
      --mdc-icon-size: 24px;
      transition: transform 220ms var(--ssc-week-ease);
    }
    .pick-chev.open {
      transform: rotate(180deg);
    }
    .pick-menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      z-index: 20;
      /* At least as wide as the button, otherwise sized by the longest calendar
         name in the list. */
      min-width: 100%;
      width: max-content;
      max-width: 80vw;
      display: flex;
      flex-direction: column;
      background: var(--ha-card-background, var(--card-background-color, #1c1c1e));
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.5);
      max-height: 0;
      opacity: 0;
      overflow: hidden;
      pointer-events: none;
      transition:
        max-height 0.22s ease,
        opacity 0.22s ease;
    }
    .pick-menu.open {
      max-height: 320px;
      opacity: 1;
      pointer-events: auto;
    }
    .pick-item {
      padding: 9px 14px 9px 10px;
      width: 100%;
      box-sizing: border-box;
    }
    .pick-item.sel {
      background: rgba(255, 255, 255, 0.13);
    }

    /* One below the date beside it - 15px range, 14px pill - in the grid, and
       13/12 in the list. It was a flat 12px, which read as a footnote next to
       the date rather than as the label for the week being shown. */
    .pill {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.3px;
      padding: 3px 9px;
      background: rgba(255, 255, 255, 0.14);
      white-space: nowrap;
    }
    /* Says the card is armed, in the place the eye already goes for "whose week
       is this". Red because edit mode is the only state where a tap can change
       somebody's timetable. Same face and size as the week pill by design. */
    .edit-pill {
      background: rgba(255, 71, 51, 1);
      color: #fff;
      flex: 0 0 auto;
      align-self: center;
      animation: editPillIn 420ms var(--ssc-spring) both;
    }
    /* The + reads as a sibling of the Edit Mode pill: same height, same face,
       square rather than lozenge-wide because it holds a glyph and not a word.
       It follows the pill in rather than arriving with it, so the eye is told
       "armed" first and "and here is what you can do" second. */
    .add-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      align-self: center;
      border: none;
      padding: 3px 7px;
      color: var(--ssc-fg);
      /* family only - size and weight come from .pill, and the shorthand would
         take the parent's size instead. line-height is NOT inherited by a
         button: the browser's own sheet sets it to normal, which is what left
         this chip 2px shorter than the pill next to it. */
      font-family: inherit;
      line-height: inherit;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      animation: editPillIn 420ms var(--ssc-spring) 90ms both;
      transition: background 0.15s ease, transform 0.15s ease;
    }
    /* A zero-width space, so the button takes the same line box the word pills
       do and the two chips are exactly the same height. A fixed px height
       cannot track that: the same rule measures 23px beside the tablet pill and
       25 beside the phone's, the line-height coming from the theme. The icon is
       kept under 1em so the strut, not the glyph, is what sets the height. */
    .add-pill::before {
      content: '\\200b';
    }
    .add-pill ha-icon {
      --mdc-icon-size: 1.3em;
      width: 1.3em;
      height: 1.3em;
      /* The ha-svg-icon INSIDE ha-icon is inline-flex, so it sits on a text
         baseline and the line box's descender pushed the glyph ~3px below
         centre — the box measured dead centre while the ink did not. Zeroing
         the line box is what removes that; the flex centring covers the rest. */
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }
    .add-pill:hover {
      background: rgba(255, 255, 255, 0.24);
    }
    .add-pill:active {
      transform: scale(0.9);
    }
    /* Arrives from behind the calendar name and settles — the same spring the
       blocks use, so it reads as part of the card rather than bolted on. */
    @keyframes editPillIn {
      from {
        opacity: 0;
        transform: translateX(-10px) scale(0.82);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    /* The wash on entering edit mode. Covers the whole card, ignores the
       pointer, and is gone in under half a second — long enough to register,
       short enough that it never gets in the way of the tap that follows. */
    /* Entering edit mode, in three layers over the same 700ms.
       A flat rectangle fading out is a screen dimmer, not a flash - which is
       what the first two attempts were. What makes this read is that the layers
       decay at DIFFERENT rates: the wash is gone in a fifth of a second, the
       edge glow lingers behind it, and the card itself takes a small knock. */
    .mode-flash {
      position: absolute;
      inset: 0;
      z-index: 30;
      pointer-events: none;
    }
    /* 1. The wash. Full strength in the first frame and mostly gone by 180ms,
          so the eye catches an afterimage rather than a red screen. */
    .mode-flash::before {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(255, 71, 51, 1);
      animation: flashWash 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    /* LEAVING edit mode. NOT the entry played backwards — reversing it verbatim
       builds the red up and then cuts it, which reads as something starting, the
       exact opposite of what it has to say.

       Entering is an impact: full strength instantly, then decay. Leaving is a
       RELEASE: the red is already there, it lets go of the edges and drains
       outward, and it never reaches the strength the entry does. Quieter and a
       little quicker, because nothing is being warned about any more. */
    .mode-flash.out::before {
      animation: flashDrainWash 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .mode-flash.out::after {
      animation: flashDrain 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    @keyframes flashDrainWash {
      0% {
        opacity: 0.2;
      }
      100% {
        opacity: 0;
      }
    }
    /* Pulled outward and away rather than blooming in from the edges. */
    @keyframes flashDrain {
      0% {
        opacity: 0.62;
        transform: scale(1);
      }
      100% {
        opacity: 0;
        transform: scale(1.22);
      }
    }
    /* 2. The bloom — a radial VIGNETTE, not an inset shadow.
          An inset shadow is drawn inward from the edges however it is tuned, so
          it always ends up looking like a red border sitting on the card; that
          was the "still too red at the end". A radial gradient with a long
          falloff has no edge to hug, and it is gone well before the animation
          ends rather than lingering at a tenth of a percent. */
    .mode-flash::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(
        130% 120% at 50% 50%,
        rgba(255, 71, 51, 0) 38%,
        rgba(255, 71, 51, 0.55) 78%,
        rgba(255, 71, 51, 0.9) 100%
      );
      animation: flashBloom 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    /* Smoothed out rather than cliff-edged: the old curve dropped from 0.62 to
       0.14 in a quarter of the run and then crawled, which is the "raw" part. */
    @keyframes flashWash {
      0% {
        opacity: 0.55;
      }
      18% {
        opacity: 0.3;
      }
      46% {
        opacity: 0.08;
      }
      100% {
        opacity: 0;
      }
    }
    @keyframes flashBloom {
      0% {
        opacity: 0.9;
        transform: scale(1);
      }
      60% {
        opacity: 0.12;
        transform: scale(1.06);
      }
      /* Zero well before the end, so nothing is left painted on the card while
         the knock finishes settling. */
      82%,
      100% {
        opacity: 0;
        transform: scale(1.1);
      }
    }
    /* 3. The knock. The card gives a little under the flash and springs back —
          the physical half of the effect, and the half that makes it feel like
          something happened TO the card rather than on top of it. */
    .panel.flash {
      animation: flashKnock 620ms var(--ssc-spring) both;
    }
    .panel.flash-out {
      animation: flashKnockOut 620ms var(--ssc-spring) both;
    }
    @keyframes flashKnock {
      0% {
        transform: scale(0.982);
      }
      100% {
        transform: none;
      }
    }
    /* The card breathes back OUT as the red lets go, rather than being knocked
       in. Same spring, opposite sense. */
    @keyframes flashKnockOut {
      0% {
        transform: scale(1.012);
      }
      100% {
        transform: none;
      }
    }
    .panel.reduce ~ .mode-flash {
      animation: none;
      display: none;
    }

    /* The overflow menu hangs off the RIGHT edge: its button is the last one in
       the header, so a left-aligned menu would run off the card. */
    .tools-menu-wrap {
      position: relative;
      display: inline-flex;
    }
    /* The overflow menu gets a POPOVER animation rather than the picker's
       max-height one. With two items its content is 88px against a 320px
       max-height, so the shared transition revealed all of it in the first 61ms
       of 220 and read as instant. Transform and opacity do not care how tall the
       content is, so this lands the same however many items it ends up with. */
    /* The same unfold the calendar picker uses — the real work of the
       transition is the SCHEDULE receding behind it (see _receded), which is
       what was missing and what made this look static.

       The one difference is the max-height, sized to this menu's own content.
       Sharing the picker's 320px meant the 84px here was fully revealed in the
       first 61ms of the transition, with the rest animating empty space. The
       doubled class beats .pick-menu.open, which is otherwise equally specific
       and comes earlier. */
    .menu-right {
      left: auto;
      right: 0;
    }
    /* Sized to the items it actually holds - 42px each plus the menu's own
       padding - rather than a constant. It was 104px, which was exactly two,
       and the phone's third command was clipped clean off the bottom. */
    .menu-right.menu-right.open {
      max-height: calc(var(--menu-items, 2) * 42px + 20px);
    }
    /*
     * CENTRED ON THE BUTTON, on a phone only.
     *
     * The wrapped header puts the tools row at the card's LEFT edge, so the dots
     * button sits in the middle of the card with 176px of nothing to its right.
     * Right-anchored to it there were only 218px before the card's left edge and
     * "Switch to Monthly View" needs 243, so the menu ran off screen. Two wrong
     * fixes preceded this one: shrinking the menu (it was a position problem,
     * not a size one) and anchoring it to the full-width row instead (it fitted,
     * but sat 160px from the button and no longer read as belonging to it).
     *
     * Centring keeps it attached AND inside: half of 243 either side of a button
     * whose centre is 198px from both card edges. min-width has to go, or the
     * menu stretches to the button's own width instead of its content's.
     */
    .narrow .menu-right {
      left: 50%;
      right: auto;
      transform: translateX(-50%);
      min-width: 0;
    }
    /* Finger-sized gaps. On the kiosk tablet these sat 3px apart and the wrong
       button got hit; 40px targets need real space between them, not just size. */
    .tools {
      display: flex;
      align-items: center;
      gap: 15px;
      flex: 0 0 auto;
    }
    .btn {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      padding: 0;
      border: none;
      border-radius: 0;
      background: rgba(255, 255, 255, 0.08);
      color: var(--ssc-fg);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease, transform 0.12s ease;
    }
    .btn:hover {
      background: rgba(255, 255, 255, 0.17);
    }
    .btn:active {
      transform: scale(0.92);
    }
    /* On = the non-default setting, so a glance says the view has been
       reshaped from what the YAML asked for. Same inversion as today's cell.
       This MUST come after :hover. Both selectors have the same specificity,
       so when .btn.on sat earlier in the sheet the hover grey won and a
       pressed button went grey instead of white - and on a touch screen the
       hover state sticks after the tap, so it stayed grey. */
    .btn.on,
    .btn.on:hover {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    .btn.off {
      opacity: 0.3;
      pointer-events: none;
    }
    .btn ha-icon {
      --mdc-icon-size: 25px;
    }
    .btn.spin ha-icon {
      animation: spin 850ms linear infinite;
    }
    .warn {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      color: var(--error-color, #ff6b6b);
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .dot {
      width: 12px;
      height: 12px;
      flex: 0 0 auto;
    }

    /* THE LATTICE. One grid template shared by the header, the all-day strip and
       the body, so a column edge is the same x in all three. Days are 1fr each:
       an empty Friday is exactly as wide as a busy Monday, always. */
    .hdr,
    .allday,
    .body {
      display: grid;
      grid-template-columns: var(--ssc-gutter) repeat(var(--cols), 1fr);
    }
    /* One line, "Wednesday, Sep 9". The weekday is what the eye lands on, so it
       carries the weight; the date is the same colour two sizes down. */
    .dayhead {
      display: flex;
      flex-direction: row;
      align-items: baseline;
      justify-content: center;
      gap: 5px;
      padding: 5px 4px 10px;
      text-align: center;
      line-height: 1.15;
    }
    .dayhead.alt {
      background: var(--ssc-band);
    }
    .dayhead .dow {
      font-size: 16px;
      font-weight: 700;
      flex: 0 1 auto;
      letter-spacing: -0.2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
    .dayhead .dnum {
      font-size: 14px;
      font-weight: 400;
    }

    .allday {
      margin-bottom: 8px;
      align-items: start;
    }
    .gut-lbl {
      font-size: 13px;
      font-weight: 500;
      padding-right: 10px;
      text-align: right;
      align-self: center;
    }
    .ad-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 0 3px;
    }
    .ad {
      font-size: 14px;
      font-weight: 600;
      padding: 5px 9px;
      background: var(--fill);
      color: #fff;
      cursor: pointer;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .body {
      position: relative;
      height: var(--body-h);
      border-top: 1px solid var(--ssc-line-strong);
    }

    /* ------------------------------------------------------------------ *
     * days-as-rows: the same lattice, transposed. Day labels down the
     * left, the hour axis across the top, blocks sized along x. Colour,
     * type and contrast handling are shared with the other orientation --
     * only the axes swap.
     * ------------------------------------------------------------------ */
    .rgrid {
      --rday-w: 172px;
      position: relative;
      /* Room for the scrollbar BELOW the last day's row rather than lying over
         it. The bar is an overlay, so without this it clips Friday. */
      padding-bottom: 18px;
    }
    /* Only the hour columns scroll. The title, week range and buttons above stay
       put, and the date column is a sibling of the scroller rather than a child
       of it -- see the note in the template. */
    .rframe {
      display: flex;
      align-items: flex-start;
    }
    .rdays {
      flex: 0 0 var(--rday-w);
      box-sizing: border-box;
    }
    .rscroll {
      flex: 1 1 auto;
      min-width: 0;
      /* The whole grid is PAINTED here rather than placed in the content. A
         scroll container's own background sits on its border box and does not
         move when the content rubber-bands, so the ruling holds and a bounce
         reads as the grid carrying on rather than as flat card.

         Only the ROW BANDING is painted here. It is constant along x, so it
         needs no phase and cannot fall out of register with the content, and
         because it does not move it fills the area a bounce exposes.

         The vertical hour lines are NOT painted: they are elements inside each
         row. Painting them needs background-attachment local to keep them in
         register with the blocks through a bounce, and that drops the scroller
         onto the main thread, which loses the rubber-band entirely. Elements
         move with the content for free and cost nothing.
         (No backticks in this comment: one ends the css template literal and
         the error surfaces hundreds of lines away.)

         The second layer masks the hour axis so the banding does not run up
         behind the times: a tiled gradient repeats in BOTH directions from its
         position, so the strip above y=31 would otherwise show the tail of the
         previous cycle as a grey band. */
      background-image:
        linear-gradient(
          var(--ha-card-background, var(--card-background-color, #1c1c1e)),
          var(--ha-card-background, var(--card-background-color, #1c1c1e))
        ),
        linear-gradient(
          to bottom,
          transparent 0,
          transparent var(--row-h),
          var(--ssc-band) var(--row-h),
          var(--ssc-band) 100%
        );
      background-position:
        0 0,
        0 31px;
      /* ONE CYCLE PER TILE, and let background-repeat do the repeating. Using a
         repeating-gradient at auto size instead makes the tile as wide as the
         scrollport, so its internal rhythm is cut mid-cycle and every tile edge
         injects a stray line off the hour. That is what put extra verticals
         between the real ones. */
      background-size:
        100% 31px,
        100% calc(var(--row-h) * 2);
      background-repeat: no-repeat, repeat;
      overflow-x: auto;
      overflow-y: hidden;
      overscroll-behavior-x: contain;
      -webkit-overflow-scrolling: touch;
      touch-action: pan-x pan-y;
      scrollbar-width: none; /* the custom thumb below replaces it */
    }
    .rscroll::-webkit-scrollbar {
      display: none;
    }
    .rinner {
      width: var(--axis-w);
      box-sizing: border-box;
      /* Closes the far end of the axis, mirroring the 2px the day column draws
         at the near end. Without it the grid just stopped. */
      border-right: 2px solid var(--ssc-line-strong);
    }
    /* The two halves are aligned by sharing these heights, not by living in one
       grid: corner to rtimes, rday to rcanvas. The corner carries only the
       horizontal rule -- the column's own side borders start at the first day
       row, so no stubs hang above it. */
    /* No top or bottom rule: the grid reads as floating rather than boxed in. */
    .rcorner,
    .rtimes {
      height: 30px;
      box-sizing: border-box;
    }
    .rtimes {
      position: relative;
    }
    .rhr {
      position: absolute;
      bottom: 7px;
      transform: translateX(-50%);
      font-size: 14px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    /* A label sitting on x=0 would have half of it outside the axis and read as
       ":00", so that one is left-aligned. The test is against ~0 rather than a
       pixel threshold because pos() is a percentage in adaptive mode, where a
       22px threshold would have caught the first five hours. */
    .rhr.first {
      transform: none;
    }
    /* And the one ON the far end would hang past it, which in adaptive mode is
       enough overflow to give the scroller a few stray pixels to scroll. */
    .rhr.last {
      transform: translateX(-100%);
    }
    .rday,
    .rcanvas {
      height: var(--row-h);
      box-sizing: border-box;
    }
    .rday.alt {
      background: var(--ssc-band);
    }
    .rday {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 1px;
      padding: 0 12px 0 10px;
      line-height: 1.15;
      /* Both lines are 2px against the hour grid's 1px, so the column reads as
         fixed furniture rather than another scrolling gridline. They live on the
         cells, not the column, so nothing hangs above the first day row. */
      border-left: 2px solid var(--ssc-line-strong);
      border-right: 2px solid var(--ssc-line-strong);
    }
    .rday .dow {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }
    .rday .dnum {
      font-size: 14px;
      font-weight: 400;
    }
    /* Today: the day/date cell only, inverted out of the dark card so it reads
       at a glance without touching the blocks themselves. */
    .rday.today,
    .rday.alt.today {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    .rcanvas {
      position: relative;
    }
    /* Elements, not paint — see the note on .rscroll's background. They sit
       inside the rows, so they never reach up into the hour labels. */
    .rlines {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .rline {
      position: absolute;
      top: 0;
      bottom: 0;
      border-left: 1px solid var(--ssc-line);
    }
    /* Same block, laid out along x instead of y: a 1px right inset keeps
       back-to-back lessons legible now the fills are opaque. */
    .ev.rev {
      padding: 1px 1px 1px 0;
    }
    .ev.rev .ev-in {
      padding: 5px 9px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      /* Same 1px as the date column, so name-over-time reads identically in
         both. The generic .ev-time margin is for the other orientation. */
      gap: 1px;
    }
    .ev.rev .ev-time {
      margin-top: 0;
    }
    /* One line, always. The axis is scaled so ~16 characters fit; anything
       longer truncates and the full title is in the detail sheet. Wrapping to a
       second line was tried and makes rows of different-length titles ragged. */
    .ev.rev .ev-name {
      font-size: 15px;
      line-height: 1.2;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* 13px, not 12: measured on the tablet as the hardest thing on the card
       to read at arm's length. One pixel is the whole budget - the block is
       only 72px tall and has to hold the name above this. */
    .ev.rev .ev-time {
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Overlay scrollbar. Chrome on the tablet draws a permanent chunky native
       bar that steals a row of pixels and never fades, so the native one is
       hidden and this mirrors the platform behaviour: visible while scrolling,
       gone about a second after it stops. */
    /* Spans the hour columns only. The day column does not scroll -- it is
       sticky -- so a track running under it would imply otherwise. */
    /* Centred in the whole gap below the last row, which is .rgrid's 18px of
       padding PLUS the panel's own 18px — hence the negative offset, which
       drops it past .rgrid's edge into the panel's padding. Centring inside
       .rgrid alone left it sitting high. Always visible whenever there is
       something to scroll to: fading it out was misleading, the card looked
       complete when there was more week off to the right. */
    /* The bar is a 16px-tall grab target with the 6px rail drawn inside it. A
       6px target is fine for a finger on the content itself, which scrolls
       directly, but it is a miserable thing to hit with a mouse - and this is
       the only way to scroll with one, since the native bar is hidden. */
    .hbar {
      position: absolute;
      left: var(--rday-w);
      right: 0;
      bottom: -8px;
      height: 16px;
      cursor: pointer;
      touch-action: none;
    }
    /* The rail, so the bar reads as something you can aim at rather than a lone
       floating thumb. Drawn on the bar's own box, centred in the grab area. */
    .hbar::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 5px;
      height: 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.08);
    }
    .hthumb {
      position: absolute;
      top: 5px;
      height: 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.42);
      cursor: grab;
    }
    .hbar:hover .hthumb {
      background: rgba(255, 255, 255, 0.6);
    }
    /* On the BAR, not the thumb: during a drag the pointer is captured by the
       bar and routinely leaves the thumb, and the cursor has to stay grabbing. */
    .hbar.dragging {
      cursor: grabbing;
    }
    .hbar.dragging .hthumb {
      cursor: grabbing;
      background: rgba(255, 255, 255, 0.75);
    }

    .rgrid.dir-fwd .rframe {
      animation: inFromRight var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    .rgrid.dir-back .rframe {
      animation: inFromLeft var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    .list.dir-fwd {
      animation: listInRight var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    .list.dir-back {
      animation: listInLeft var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    .lines {
      position: absolute;
      top: 0;
      bottom: 0;
      left: var(--ssc-gutter);
      right: 0;
      pointer-events: none;
      z-index: 2;
    }
    .line {
      position: absolute;
      left: 0;
      right: 0;
      border-top: 1px solid var(--ssc-line);
    }
    .gutter {
      position: relative;
    }
    .hr {
      position: absolute;
      right: 11px;
      transform: translateY(-50%);
      font-size: 14px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .day {
      position: relative;
      border-left: 1px solid var(--ssc-line);
    }
    .day.alt {
      background: var(--ssc-band);
    }

    /* ---- press-and-hold on empty space ------------------------------- *
     *
     * Half a second is a long time to hold something that gives nothing back,
     * so the slot draws itself while the finger is down: it is the only signal
     * that the press has been noticed AND the only preview of where the event
     * will land. It fills as the hold completes, so letting go early visibly
     * abandons something rather than silently doing nothing.
     *
     * Selection and the long-press callout are off in edit mode only. Outside
     * it the grid is ordinary text again, and turning either off globally would
     * make the card the one thing on the dashboard you cannot copy out of.
     */
    .rgrid.editing .rcanvas,
    .rgrid.editing .rday,
    .grid.editing .day,
    .grid.editing .dayhead,
    .list.editing .ld-head {
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
      cursor: cell;
    }
    /* Every day label is a press target, and each holds its own overlay. */
    .rday,
    .dayhead {
      position: relative;
    }
    .press-ghost {
      position: absolute;
      z-index: 2;
      box-sizing: border-box;
      pointer-events: none;
      background: rgba(255, 255, 255, 0.14);
      border: 2px solid var(--ssc-fg, #fff);
      /* animation-duration comes inline, off the same constant the timer uses -
         the fill has to finish exactly when the sheet opens, not near it. */
      animation-name: pressHold;
      animation-timing-function: cubic-bezier(0.33, 0, 0.2, 1);
      animation-fill-mode: both;
    }
    /* Fills the day label that is being held — the cell down the left of the
       transposed grid, the heading across the top of the other one, or the day
       heading in the list. It never covers the timeline beside it: what is
       being claimed is the DAY, and the time comes from the clock. */
    /* height:100%, not inset:0. Measured: with top and bottom both zero the box
       came out 6px short — the heading's bottom padding — while height:100%
       resolves against the full padding box every time. Do not "simplify" this
       back to inset. */
    .press-ghost.head {
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
    }
    @keyframes pressHold {
      0% {
        opacity: 0;
        transform: scale(0.86);
      }
      45% {
        opacity: 0.5;
        transform: scale(1);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .ev {
      position: absolute;
      box-sizing: border-box;
      padding: 0 2px 1px;
      cursor: pointer;
      z-index: 3;
      -webkit-tap-highlight-color: transparent;
      /* Fill mode BACKWARDS, never both. Both pins the end state after the
         animation finishes, which outranks the dimmed rule below and freezes
         the cells. Backwards still covers the staggered delay, and the end state
         is the element's normal CSS anyway.
         (No backticks anywhere in this literal - one ends it and the error lands
         hundreds of lines away. This is the second time.) */
      animation: evIn var(--ssc-block-dur) var(--ssc-block-ease) backwards;
    }
    /* Each block is its own query container, so one that is too narrow for its
       time line can drop it and hand the room to the name. Width-driven rather
       than mode-driven: the same block is 144px in fixed mode and 36px in
       adaptive over a whole day, and it has to read in both. */
    .ev {
      container-type: inline-size;
    }
    /* Measured: the time is 65-80px of digits, while a 36px block has 18px of
       content box once padding is taken. It cannot fit at any font size, and
       keeping it truncated BOTH lines to a single letter and an ellipsis.
       Dropping it, and pulling the padding in, gets most subject names fully
       legible instead - which is the only thing worth reading at that size. */
    @container (max-width: 90px) {
      .ev.rev .ev-time {
        display: none;
      }
      /* text-align, but NOT align-items: center. As a centred flex item the
         name sizes to its CONTENT, so a long one overflowed the block on both
         sides and you were left reading its middle - "/ Geog" out of
         "ICT / Geography". Stretched to the block instead, a short name still
         centres and a long one clips from the start with an ellipsis, which
         is the half worth keeping. */
      .ev.rev .ev-in {
        padding: 4px 3px;
        text-align: center;
      }
      .ev.rev .ev-name {
        letter-spacing: -0.3px;
      }
    }
    /* Opaque: the event's colour, nothing of the grid behind it showing through,
       and square. The label is white the way Google's own calendar draws it. */
    .ev-in {
      height: 100%;
      box-sizing: border-box;
      padding: 7px 10px;
      overflow: hidden;
      background: var(--fill);
      color: #fff;
      transition: transform 160ms var(--ssc-glide), filter 160ms ease;
    }
    .ev:active .ev-in {
      transform: scale(0.97);
    }
    .ev.sel .ev-in {
      filter: brightness(1.3);
    }
    .ev-name {
      font-size: 17px;
      font-weight: 700;
      line-height: 1.18;
      letter-spacing: -0.25px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    /* Same colour as the name, two steps down in size and three in weight. That
       is the entire hierarchy mechanism in this card. */
    .ev-time {
      margin-top: 2px;
      font-size: 13px;
      font-weight: 400;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .ev.compact .ev-in {
      padding: 4px 10px;
      display: flex;
      align-items: center;
    }
    .ev.compact .ev-name {
      font-size: 15px;
      -webkit-line-clamp: 1;
    }
    @keyframes evIn {
      from {
        opacity: 0;
        transform: translateY(9px) scale(0.965);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    /* Identical to evIn. Alternating between the two is what restarts the
       cascade when the calendar menu closes — a CSS animation only restarts on a
       change of NAME. */
    @keyframes evInB {
      from {
        opacity: 0;
        transform: translateY(9px) scale(0.965);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    /* While the calendar menu is open the schedule recedes: dimmed to a fifth
       and the cells folded most of the way back out, so the menu is plainly the
       thing in focus.
       The transitions live on the DIMMED rule only, so going in is a glide and
       coming out is instant — the entry cascade then replays over the top and
       carries the fade back in itself. Two overlapping fades looked like a
       flicker. */
    .rgrid.dimmed .rframe,
    .grid.dimmed .body,
    .grid.dimmed .hdr {
      opacity: var(--ssc-dim-opacity, 0.1);
      transition: opacity 240ms var(--ssc-glide);
    }
    .rgrid.dimmed .ev,
    /* The weekday row goes back with the cells it heads. It was left out, so a
       sheet opened over a month whose column titles were still at full strength
       - the one bright row in an otherwise receded grid. */
    .mgrid.dimmed .mcell,
    .mgrid.dimmed .mhead {
      transform: translateY(var(--ssc-dim-lift, 18px)) scale(var(--ssc-dim-scale, 0.94));
      opacity: 0.1;
      transition:
        transform 260ms var(--ssc-glide),
        opacity 260ms var(--ssc-glide);
    }
    /* The day panel recedes WITH the grid it belongs to. It stays open behind
       the detail sheet, and at full strength it competed - two lists of the
       same events, one over the other.
       Its CONTENTS fade; its surface does not. Two earlier attempts were both
       wrong in the same place, which is that a panel is not a cell: fading the
       whole thing (opacity 0.1) let the grid read straight through it, and
       darkening the whole thing (brightness) turned an already-dark surface
       into a black hole punched in the card. Keeping the surface at the card's
       own background and fading only what sits ON it leaves a quiet empty
       panel - opaque, so nothing shows through, and no darker than its
       surroundings, so it is not a hole either.
       !important on the transform because peekIn is a fill:both animation still
       holding it at none, which a plain rule cannot outrank. */
    .mgrid.dimmed .daypeek {
      transform: translateY(var(--ssc-dim-lift, 18px)) scale(var(--ssc-dim-scale, 0.94)) !important;
      box-shadow: none;
      border-color: rgba(255, 255, 255, 0.07);
      transition:
        transform 260ms var(--ssc-glide),
        box-shadow 260ms var(--ssc-glide),
        border-color 260ms var(--ssc-glide);
      pointer-events: none;
    }
    .mgrid.dimmed .daypeek > * {
      opacity: 0.13;
      transition: opacity 260ms var(--ssc-glide);
    }
    .mgrid.dimmed .peek-scrim {
      pointer-events: none;
    }
    .grid.dimmed .ev {
      transform: translateY(var(--ssc-dim-lift, 9px)) scale(var(--ssc-dim-scale, 0.963));
      transition: transform 240ms var(--ssc-glide);
    }
    /* The list recedes further than the grid does. It is the phone layout, the
       rows are big targets, and there is no fine ruling to lose — so it can take
       a deeper fold without turning to mush. */
    .list.dimmed {
      opacity: var(--ssc-dim-opacity, 0.1);
      transition: opacity 240ms var(--ssc-glide);
    }
    .list.dimmed .lr,
    .list.dimmed .ld-head {
      transform: translateY(var(--ssc-dim-lift-list, 26px))
        scale(var(--ssc-dim-scale-list, 0.86));
      transition: transform 260ms var(--ssc-glide);
    }


    /* Week navigation: the whole lattice slides a short distance and fades. The
       blocks re-run their own stagger on top, so the new week assembles rather
       than snapping. */
    .grid.dir-fwd .body,
    .grid.dir-fwd .hdr,
    .mgrid.dir-fwd .mbody,
    .mgrid.dir-fwd .mhead {
      animation: inFromRight var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    .grid.dir-back .body,
    .grid.dir-back .hdr,
    .mgrid.dir-back .mbody,
    .mgrid.dir-back .mhead {
      animation: inFromLeft var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    /* The fold: the lattice arrives slightly small and settles to size as it
       fades up, which is what stops a pure slide reading as a jump cut. Paired
       with the imperative fade-out in _navigate - the week goes one way, the
       next one comes from the other. */
    @keyframes inFromRight {
      from {
        opacity: 0;
        transform: translateX(30px) scale(0.985);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes inFromLeft {
      from {
        opacity: 0;
        transform: translateX(-30px) scale(0.985);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    /* The week range travels with the schedule, but a short distance and on its
       own timing. It is one line of text a few centimetres wide: the lattice's
       30px reads as a slide there and as a lurch here.

       Deliberately SHORTER than --ssc-week-dur. The dir class is cleared by the
       content's own animationend, so an animation that outlasted it would have
       the class pulled out from under it mid-move; finishing first means the
       clear lands on an element already at rest. */
    .range.dir-fwd {
      animation: rangeInRight 420ms var(--ssc-week-ease) both;
    }
    .range.dir-back {
      animation: rangeInLeft 420ms var(--ssc-week-ease) both;
    }
    @keyframes rangeInRight {
      from {
        opacity: 0;
        transform: translateX(14px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes rangeInLeft {
      from {
        opacity: 0;
        transform: translateX(-14px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    /* The shared 30px nudge is invisible across a full-width list, where it was
       reported as almost undetectable. The list gets a real slide of its own,
       without disturbing the grid that shares inFromRight/inFromLeft. */
    @keyframes listInRight {
      from {
        opacity: 0;
        transform: translateX(34%) scale(0.985);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes listInLeft {
      from {
        opacity: 0;
        transform: translateX(-34%) scale(0.985);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    .list {
      display: flex;
      flex-direction: column;
      /* The whole gap between one day's last event and the next day's heading
         is this plus the two groups' own padding: 4 + 15 + 8 = 27px. */
      gap: 15px;
    }
    .ld {
      padding: 8px 10px 4px;
    }
    /* Padding and the negative margin are on EVERY heading, not just today's,
       so the text stays on the same left edge whichever day it is and only the
       fill changes. */
    /* The width toggle sliding away when a month grid gives it nothing to do.
       Width and margin collapse together so the neighbour closes the gap rather
       than the button leaving a hole behind it. */
    .btn.width-toggle {
      overflow: hidden;
      transition:
        width 0.42s var(--ssc-spring),
        min-width 0.42s var(--ssc-spring),
        margin 0.42s var(--ssc-spring),
        opacity 0.24s ease,
        transform 0.42s var(--ssc-spring);
    }
    /* Fades and slides out but KEEPS ITS SLOT. Collapsing the width shrank the
       group, and because the group is centred that moved the mode button
       sideways every time the month grid came or went - so the control you had
       just tapped was no longer under the pointer. The empty slot costs nothing
       to look at and keeps the button still. */
    .btn.width-toggle.gone {
      opacity: 0;
      transform: translateX(-8px) scale(0.8);
      pointer-events: none;
    }

    /* ---- the month grid -------------------------------------------------
     *
     * Seven equal columns that divide the card, so a month never scrolls
     * sideways - the one deliberate departure from view_width_mode: fixed,
     * because a month you cannot see the end of is not a month. Six rows
     * always, so the card keeps its height as you page through the year.
     */
    /* Out to the card's own edges. A month is furniture that reaches the frame;
       an 18px gutter down each side of it reads as a mistake rather than as
       margin, and those are seven columns that would rather have the pixels. */
    .mgrid {
      display: flex;
      flex-direction: column;
      position: relative;
      margin: 0 calc(-1 * var(--ssc-pad));
    }
    /* No bleed on a phone. Reaching past the card's inset is a flourish a wide
       card can afford; at 394px it just pushed the first and last columns off
       the edges. */
    .mgrid.compact {
      margin: 0;
    }
    /* Banded like the week grid's day column, so the header reads as the same
       piece of fixed furniture rather than as a line of text above a grid. */
    .mhead {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      border-bottom: 2px solid var(--ssc-line-strong);
      background: var(--ssc-band);
    }
    /* .rday, the week grid's day cell, rebuilt here - not just its type.
       Matching the FACE alone was tried twice and is not the same thing: .rday
       is a flex column that centres its label in a tall cell with air above and
       below, and a 16px/700 label crammed against the top of a 26px strip reads
       as nothing like it however identical the font. So this takes the whole
       box: the column layout, the centring, the 10px/12px padding, the 1px gap,
       and a min-height equal to .rday's two-line block (18.4 + 1 + 16.1) so the
       label has the same room to sit in. */
    .mdow {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 1px;
      /* .rday's two-line block (18.4 + 1 + 16.1) plus 5px of air. */
      min-height: 41px;
      box-sizing: border-box;
      padding: 0 12px 0 10px;
      text-align: left;
      line-height: 1.15;
      /* Deliberately the same size, weight and colour as .mdate: the weekday at
         the top of a column and the number in a cell are one label split in
         two, and they read as a pair only if nothing distinguishes them but
         position. Change one, change the other. */
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }
    /* Column separators on the same 1px as the cells below, so the header's
       divisions line up with the month's instead of floating over them. */
    .mdow:not(:nth-child(7n)) {
      border-right: 1px solid var(--ssc-line);
    }

    /* ---- the month on a phone -------------------------------------------
     *
     * Seven columns dividing the card, about 50px each. Everything here is the
     * tablet cell at a smaller size rather than a different thing: a date, one
     * NAMED event, and a "+N" under it. The time is what goes - it is the one
     * part a tap can recover in full, and dropping it buys the name most of the
     * column.
     *
     * The .mevs wrapper is display:contents everywhere, so the rows stack as
     * they always did and the tablet pays nothing for it. */
    .mevs {
      display: contents;
    }
    /* Air between the header and the grid, so the month's name is not sitting
       on the weekday row. */
    .mgrid.compact {
      margin-top: 22px;
    }
    /* align-items, not just text-align: .mdow inherits .rday's flex COLUMN with
       align-items:flex-start, and a bare text node in it is a flex item — so
       text-align alone left it hard against the column's left edge. */
    .mgrid.compact .mdow {
      /* Half again the row's natural height. This is the day-name cell, which
         has one short word in it and was the cramped part - not the month
         cells below, which fit the screen. */
      min-height: 45px;
      align-items: center;
      padding: 8px 0;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-align: center;
    }
    .mgrid.compact .mcell {
      gap: 1px;
      padding: 4px 2px 5px;
    }
    /* The number gets room of its own here too, and the events start below it
       rather than against it. */
    .mgrid.compact .mdate {
      padding: 2px 5px 16px 0;
      font-size: 14px;
      line-height: 1.15;
    }
    .mgrid.compact .mev,
    .mgrid.compact .mmore {
      padding: 0 1px 0 3px;
      gap: 3px;
      font-size: 11px;
      line-height: 1.3;
    }
    /* No room for a time in 50px, and it is the part a tap gives back. */
    .mgrid.compact .mtime {
      display: none;
    }
    .mgrid.compact .mname {
      font-weight: 600;
      letter-spacing: -0.2px;
    }
    .mgrid.compact .mdot {
      width: 7px;
      height: 7px;
    }
    .mgrid.compact .mmore {
      padding-left: 12px;
      font-weight: 700;
      opacity: 0.75;
    }
    /* Today's weekday, inverted like its cell and like .rday.today - so the
       column you are in is marked at the top as well as in the grid. Only while
       today is actually on show; see todayCol. */
    .mdow.today {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    .mbody {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      /* The rows share --mgrid-h, which _measureMonth works out from the window
         and clamps between a one-event and a three-event cell. The minmax is
         only a floor for the very first paint, before there is a cell to
         measure; after that --mgrid-h is exact. */
      grid-auto-rows: minmax(64px, 1fr);
      height: var(--mgrid-h, auto);
    }
    .mgrid.compact .mbody {
      grid-auto-rows: minmax(${Rt}px, 1fr);
    }
    .mcell {
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      /* The padding-bottom is MONTH_BREATHE_PX, and it is doing two jobs at
         once: it is the air you see under the last event, and it is the room
         _measureMonthFit holds back when it works out how many events fit. One
         number, one place - change it and both move together. */
      gap: 1px;
      padding: 3px 4px ${_t}px;
      /* The cell IS the target - a tap anywhere in it opens the day. */
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      box-sizing: border-box;
      border-right: 1px solid var(--ssc-line);
      border-bottom: 1px solid var(--ssc-line);
      /* Same fill mode and easing as the week blocks, so switching between the
         two shapes does not switch how the card moves. */
      animation: evIn var(--ssc-block-dur) var(--ssc-block-ease) backwards;
    }
    .mcell:nth-child(7n) {
      border-right: none;
    }
    /* The probe frame: laid out so it can be measured, but shown to nobody and
       animating not at all. One frame, then the real render animates in at the
       right size. Hidden by visibility rather than display, because a grid with
       no boxes has nothing to measure - and the animation reset needs
       !important, because the cascade puts animation-name inline where a plain
       rule cannot reach it. */
    .mbody.probing {
      visibility: hidden;
    }
    .mbody.probing .mcell {
      animation: none !important;
    }
    /* The cramped layout: the two discretionary paddings handed back so another
       event fits. _measureMonth turns this on only when it buys a whole row, and
       the savings here must equal MONTH_TRIM_FOOT and MONTH_TRIM_DATE. */
    .mbody.tight .mcell {
      padding-bottom: ${_t - zt}px;
    }
    .mbody.tight .mdate {
      padding-bottom: ${9 - Wt}px;
    }
    /* The days either side of the month. Drawn rather than left blank - an
       empty corner reads as a rendering fault - but clearly not this month. */
    .mcell.out {
      background: rgba(0, 0, 0, 0.16);
    }
    .mcell.out .mdate {
      opacity: 0.35;
    }
    .mcell.out .mev {
      opacity: 0.55;
    }
    /* A bare number, top right. The day it belongs to is named in full in the
       header above, so repeating "Sep" in all thirty-five cells was saying the
       same thing thirty-five times - tried, and it crowded the events out.
       Larger than a week grid's date line because it is the only thing here
       carrying the day. */
    .mdate {
      flex: 0 0 auto;
      text-align: right;
      /* Half again the bare line box - 22px of type given 35px of room - so the
         number sits in its own band instead of leaning on the first event, and
         clear of the cell's top and right rules rather than tight against them.
         _measureMonth reads this height back off the DOM, so the events below
         lose the space honestly rather than being clipped by it. */
      padding: 4px 6px 9px;
      /* Paired with .mdow - same size, same weight, same colour. See there. */
      font-size: 18px;
      line-height: 1.25;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    /* Today: the WHOLE cell inverted, exactly as the week grid inverts its day
       cell. An earlier version pilled just the number, which at arm's length
       was a dot rather than a day. */
    .mcell.today,
    .mcell.out.today {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    .mcell.today .mdate {
      font-weight: 700;
    }
    /* Today can fall outside the month on show - 30 September is in October's
       leading row - and there it is still today, not a dimmed neighbour. */
    .mcell.out.today .mdate,
    .mcell.out.today .mev {
      opacity: 1;
    }
    /* Plain rows, NOT controls. They carry no hover and no pointer of their own,
       because a highlight on one event promises it can be tapped and it cannot -
       the cell owns the tap. The names here are truncated summaries; picking one
       happens in the day panel. */
    .mev,
    .mmore {
      display: flex;
      align-items: center;
      gap: 5px;
      width: 100%;
      box-sizing: border-box;
      /* Indented from the cell's left rule so the dots read as a column of
         their own rather than sitting on the gridline. */
      padding: 1px 4px 1px 7px;
      border-radius: 4px;
      font-size: 13px;
      line-height: 1.25;
      text-align: left;
    }
    /* Used in both places this dot appears: the month cells and the day panel.
       At 9px it was a full stop rather than a colour - the one thing in a cell
       that has to be readable at a glance from across a room. */
    .mdot {
      flex: 0 0 auto;
      width: 11px;
      height: 11px;
      border-radius: 50%;
    }
    .mtime {
      flex: 0 0 auto;
      font-variant-numeric: tabular-nums;
      opacity: 0.85;
    }
    .mname {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 600;
    }
    /* Text lined up with the event TIMES above it, not with their dots: the
       row's own left padding, plus a dot, plus the gap after it. Keep this in
       step with .mev's padding-left and .mdot's width or it drifts. */
    .mmore {
      font-weight: 700;
      opacity: 0.8;
      padding-left: 23px;
    }

    /* ---- the day panel ----
       Google's "N more" popup, plus the END time. "4am" says nothing useful
       about a collection that runs until 10. */
    .peek-scrim {
      position: absolute;
      inset: 0;
      z-index: 5;
    }
    .daypeek {
      position: absolute;
      z-index: 6;
      box-sizing: border-box;
      padding: 10px 10px 12px;
      background: var(--ha-card-background, #1c1c1e);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
      border: 1px solid var(--ssc-line-strong);
      animation: peekIn 320ms var(--ssc-block-ease) both;
      transform-origin: top center;
    }
    @keyframes peekIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(-6px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    /* The name and the date are one block, so today's inversion covers both -
       and the close button with them. Negative margins cancel .daypeek's own
       padding so the fill reaches the panel's edges rather than floating in it. */
    .dp-title {
      margin: -10px -10px 0;
      padding: 10px 10px 8px;
    }
    .dp-title.today {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    .dp-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    /* The week grid's day cell, at heading scale: name over date, the name the
       heavier of the two. It was a 12px "THU" kicker over a bare 10, which is
       the abbreviation a month CELL is forced into - and this panel has room.
       Full strength, like every other piece of text on this card. */
    .dp-dow {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }
    .dp-close {
      width: 28px;
      height: 28px;
      display: grid;
      place-items: center;
      border: none;
      border-radius: 50%;
      background: transparent;
      /* inherit, so the × darkens with the title block on today. */
      color: inherit;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .dp-close:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    .dp-title.today .dp-close:hover {
      background: rgba(0, 0, 0, 0.1);
    }
    .dp-close ha-icon {
      --mdc-icon-size: 18px;
    }
    .dp-date {
      font-size: 16px;
      font-weight: 400;
      padding: 1px 2px 0;
    }
    .dp-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 260px;
      overflow-y: auto;
      overscroll-behavior: contain;
    }
    /* These rows are now the ONLY way into an event from a month, so they are
       sized as targets rather than as lines of text: ~36px, near enough a
       fingertip, where 26px was a row you had to aim at. */
    .dp-row {
      display: flex;
      align-items: baseline;
      gap: 7px;
      width: 100%;
      box-sizing: border-box;
      padding: 10px 6px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 14px;
      text-align: left;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    /* Zebra. With the times shrink-wrapped rather than in a fixed column, the
       band is what carries the eye from a time to its name across a gap that
       changes width every row. */
    .dp-row:nth-child(even) {
      background: rgba(255, 255, 255, 0.05);
    }
    .dp-row:hover {
      background: rgba(255, 255, 255, 0.12);
    }
    /* Shrink to the time it holds. A fixed column that aligned every summary on
       the same x was tried and rejected - it forced the panel wider and left a
       gutter between each time and its name. */
    .dp-when {
      flex: 0 0 auto;
      font-variant-numeric: tabular-nums;
      opacity: 0.85;
    }
    .dp-name {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 600;
    }

    .ld-head {
      display: block;
      padding: 6px 10px;
      margin: 0 -10px 4px;
      /* Holds the press overlay, which fills it. */
      position: relative;
    }
    .ld-head-in {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    /* Same inversion as the grid's day cell. */
    .ld-head.today {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    .ld-head .dow {
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }
    .ld-head .dnum {
      font-size: 14px;
      font-weight: 400;
    }
    .lr {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 10px;
      margin: 0 -10px;
      border-top: 1px solid var(--ssc-line);
      cursor: pointer;
      animation: evIn var(--ssc-block-dur) var(--ssc-block-ease) backwards;
    }
    /* Banding alternates per EVENT ROW, not per day. The day heading is the
       first child, so a row's own index is one behind its child index: odd
       children are the even rows, which is what gets banded. The negative margin
       lets the band run to the card's edges past .ld's padding. */
    .lr:nth-child(odd) {
      background: var(--ssc-band);
    }
    .lr-bar {
      width: 5px;
      align-self: stretch;
      flex: 0 0 auto;
    }
    .lr-time {
      font-size: 13px;
      font-weight: 400;
      line-height: 1.25;
      font-variant-numeric: tabular-nums;
      min-width: 52px;
    }
    .lr-name {
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -0.2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .lr.empty {
      font-size: 15px;
      font-weight: 400;
      opacity: 0.55;
      cursor: default;
      animation: none;
    }

    /* FIXED, not absolute. In the list layout the card is far taller than the
       viewport, so an absolutely-positioned scrim centres itself in the CARD —
       which put the sheet somewhere down the page, out of sight until you
       scrolled to it. Fixed centres it in the viewport in both layouts.
       The wash is light because the schedule behind it already recedes; the
       two together were near-black. */
    .scrim {
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      background: rgba(0, 0, 0, 0.32);
      z-index: 10;
      animation: fadeIn 180ms ease both;
    }
    .sheet {
      position: relative;
      min-width: 240px;
      max-width: 76%;
      background: var(--ha-card-background, #1c1c1e);
      /* Room at the top and right for the close button, so the title is not
         squeezed up against it. */
      padding: 24px 20px 24px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
      border-top: 5px solid var(--accent);
      /* BACKWARDS, not both. Both pins the end state after the animation, which
         outranks the rubber band's transform and leaves the sheet unable to
         move — the same trap the event blocks hit. */
      animation: sheetIn 460ms var(--ssc-block-ease) backwards;
    }
    /* Top right, out of the text flow, with the title reserving room for it so
       a long name wraps before it reaches. Same 28px circle the day panel's
       close uses, so the two dismissals look like the same control. */
    .sh-close {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 28px;
      height: 28px;
      display: grid;
      place-items: center;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: inherit;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease;
    }
    .sh-close:hover {
      background: rgba(255, 255, 255, 0.12);
    }
    .sh-close ha-icon {
      --mdc-icon-size: 20px;
    }
    .sh-name {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.4px;
      line-height: 1.18;
      /* Clear of the close button. */
      padding-right: 32px;
    }
    .sh-time {
      margin-top: 12px;
      font-size: 17px;
      font-weight: 600;
    }
    .sh-cal {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-top: 10px;
      font-size: 15px;
      font-weight: 400;
    }
    .sh-row {
      margin-top: 10px;
      font-size: 15px;
      font-weight: 400;
      line-height: 1.4;
    }
    /* The repeat rule earns an icon where the other rows do not: location and
       notes are self-evidently what they say, and "Weekly on Friday" on its own
       could be read as part of the description above it. */
    .sh-row.repeat {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sh-row.repeat ha-icon {
      --mdc-icon-size: 18px;
      flex: 0 0 auto;
      opacity: 0.85;
    }

    /* ---- the edit form -------------------------------------------------
       Shaped like an iOS grouped list - labelled rows in banded groups, the
       actions last - but SQUARE, because nothing in this card has a rounded
       corner and one rounded box here would read as a mistake. Wider than the
       read-only sheet, and scrollable, because a form has to fit a phone in
       landscape with a keyboard over half of it. */
    .sheet.editor {
      width: 520px;
      max-width: 94vw;
      max-height: 90vh;
      overflow-y: auto;
      padding: 16px 18px 18px;
      /* Stops a scroll that reaches the end of this box from continuing into
         the week behind it. The case where the box does not scroll AT ALL is
         not this property's to solve - see _onDragMove. */
      overscroll-behavior: contain;
    }
    /* The rubber band. The offset is written straight to the element during the
       drag, with no transition, and the class is added on release so the spring
       is the only animated part of the gesture. */
    .sheet.editor,
    .recmodal {
      transform: translateY(var(--rubber, 0px));
    }
    .sheet.editor.springing,
    .recmodal.springing {
      transition: transform 520ms var(--ssc-spring);
    }
    .panel.reduce ~ .scrim .sheet.editor.springing,
    .panel.reduce ~ .scrim .recmodal.springing {
      transition: none;
    }
    .ed-title {
      width: 100%;
      box-sizing: border-box;
      background: transparent;
      border: none;
      border-bottom: 1px solid var(--ssc-line-strong);
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.3px;
      padding: 2px 0 10px;
      outline: none;
    }
    .ed-title:focus {
      border-bottom-color: var(--accent);
    }
    .ed-group {
      margin-top: 16px;
      background: var(--ssc-band);
    }
    .ed-head {
      padding: 10px 12px 9px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      opacity: 0.75;
    }
    .ed-row {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 44px;
      padding: 6px 12px;
      border-top: 1px solid var(--ssc-line);
    }
    /* The group's first row sits against the heading or the group edge, so it
       needs no rule above it. */
    .ed-row:first-child,
    .ed-head + .ed-row {
      border-top: none;
    }
    .ed-lbl {
      flex: 0 0 auto;
      min-width: 78px;
      font-size: 15px;
      font-weight: 600;
    }
    .ed-vals {
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      min-width: 0;
    }
    /* No flex gap on a picker row: the time chip carries its own margin so the
       space between the two chips can collapse with the chip itself. A class
       rather than :has(), which iOS Safari only learned in 15.4 and this has to
       work on whatever phone is in the house. */
    .ed-vals.picks {
      gap: 0;
    }
    /* The tappable value on a date or time row — iOS's grey value chip, square.
       44px tall because this is the control a finger actually aims at. */
    .ed-chip {
      border: 1px solid transparent;
      background: rgba(255, 255, 255, 0.09);
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 15px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      padding: 0 14px;
      min-height: 40px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease;
    }
    .ed-chip:hover {
      background: rgba(255, 255, 255, 0.14);
    }
    /* Open, and showing its picker below. Inverted rather than merely tinted, so
       which of the four rows you are editing is never in question. */
    .ed-chip.on {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    /* The time chip collapses rather than disappearing when all-day goes on, so
       both directions can spring. Everything that contributes to its width has
       to be in the transition — max-width alone leaves the padding and the flex
       gap behind, and the row jumps by the difference. */
    .ed-chip.time {
      margin-left: 8px;
      max-width: 160px;
      overflow: hidden;
      white-space: nowrap;
      transform-origin: right center;
      transition:
        max-width 0.4s var(--ssc-spring),
        padding 0.4s var(--ssc-spring),
        margin 0.4s var(--ssc-spring),
        opacity 0.26s ease,
        transform 0.4s var(--ssc-spring);
    }
    .ed-chip.time .chip-in {
      display: block;
    }
    .ed-chip.time.gone {
      max-width: 0;
      padding-left: 0;
      padding-right: 0;
      margin-left: 0;
      border-width: 0;
      opacity: 0;
      transform: scale(0.6);
      pointer-events: none;
    }
    /* Two animations, not one. The OUTER box opens the space it needs on a
       plain ease, because height overshooting would shove the rest of the form
       up and back; the INNER content drops in on the overshooting spring, which
       is where the elastic settle actually belongs. Running the spring on the
       height instead looks like a glitch. */
    .ed-picker {
      border-top: 1px solid var(--ssc-line);
      background: rgba(0, 0, 0, 0.18);
      overflow: hidden;
      animation: pickerOpen 260ms var(--ssc-week-ease) both;
    }
    .ed-picker > * {
      animation: pickerDrop 420ms var(--ssc-spring) both;
    }
    @keyframes pickerOpen {
      from {
        max-height: 0;
        opacity: 0;
      }
      to {
        max-height: 460px;
        opacity: 1;
      }
    }
    @keyframes pickerDrop {
      from {
        transform: translateY(-14px) scale(0.94);
        opacity: 0;
      }
      to {
        transform: none;
        opacity: 1;
      }
    }

    /* ---- month grid ---- */
    .cal {
      padding: 8px 10px 12px;
    }
    .cal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .cal-month {
      font-size: 16px;
      font-weight: 700;
    }
    .cal-nav {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border: none;
      background: transparent;
      color: var(--ssc-fg);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .cal-nav:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .cal-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      margin-top: 6px;
    }
    /* The month arriving. Two names for one animation so that alternating them
       restarts it on every step - see _stepMonth. The offset comes in as a
       custom property, signed by the direction of travel, so a month stepped
       forward slides in from the right and back from the left. */
    .cal-month,
    .cal-day {
      animation-duration: 300ms;
      animation-timing-function: var(--ssc-block-ease);
      animation-fill-mode: backwards;
    }
    @keyframes calDayA {
      from {
        opacity: 0;
        transform: translateX(var(--cal-from, 0px));
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes calDayB {
      from {
        opacity: 0;
        transform: translateX(var(--cal-from, 0px));
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    .cal-dow {
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      opacity: 0.6;
      padding-bottom: 4px;
    }
    /* 40px square: the smallest a day can be and still be hit reliably with a
       thumb, which is the whole reason this replaced the native picker. */
    .cal-day {
      min-height: 40px;
      border: none;
      background: transparent;
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 15px;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .cal-day:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .cal-day.today {
      font-weight: 700;
      box-shadow: inset 0 0 0 1px var(--ssc-line-strong);
    }
    .cal-day.sel {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
      font-weight: 700;
    }

    /* ---- time drum ----
       Two scroll-snap columns with a fixed band across the middle. The padding
       rows are what let the first and last values reach the centre. */
    .wheel {
      position: relative;
      display: flex;
      align-items: stretch;
      justify-content: center;
      gap: 6px;
      height: var(--wheel-h);
      padding: 0 10px;
    }
    .wheel-band {
      position: absolute;
      left: 10px;
      right: 10px;
      top: calc(50% - 22px);
      height: 44px;
      background: rgba(255, 255, 255, 0.08);
      pointer-events: none;
    }
    .wheel-col {
      flex: 0 1 120px;
      overflow-y: scroll;
      scroll-snap-type: y mandatory;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      text-align: center;
    }
    .wheel-col::-webkit-scrollbar {
      display: none;
    }
    .wheel-pad {
      height: calc(var(--wheel-h) / 2 - 22px);
    }
    .wheel-item {
      height: 44px;
      line-height: 44px;
      scroll-snap-align: center;
      /* A row is a target, not just something to drag past — see _spinWheel. */
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      font-size: 20px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      opacity: 0.45;
      transition: opacity 0.15s ease;
    }
    .wheel-item:hover {
      opacity: 0.8;
    }
    .wheel-item.sel {
      opacity: 1;
      font-weight: 700;
    }
    .wheel-sep {
      align-self: center;
      font-size: 20px;
      font-weight: 700;
      opacity: 0.5;
    }

    /* ---- colour swatches, Google's shape ----
       ROUND, which is the one place this card breaks its own no-radius rule:
       the palette is lifted from Google Calendar deliberately, so that it is
       recognisably the same control, and a grid of squares is not it. */
    /* Six across, at roughly Google's own size. They were 42px, which on a
       12-swatch grid dominated the form; the grid is a glance-and-tap target,
       not the point of the screen. */
    .sw-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 10px;
      padding: 12px;
      justify-items: center;
    }
    .sw {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: none;
      padding: 0;
      display: grid;
      place-items: center;
      background: var(--sw, transparent);
      color: #fff;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition:
        transform 0.2s var(--ssc-spring),
        box-shadow 0.2s ease;
    }
    .sw:hover {
      transform: scale(1.08);
    }
    .sw:active {
      transform: scale(0.94);
    }
    .sw ha-icon {
      --mdc-icon-size: 17px;
      /* A tick has to read on banana as well as on tomato. */
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
    }
    /* "Whatever the calendar is" — an outline, because it is the ABSENCE of an
       override rather than a twelfth colour. Google's picker puts a + here; this
       is not adding anything, so a slashed ring says it better. */
    .sw.none {
      box-shadow: inset 0 0 0 2px var(--ssc-line-strong);
      color: var(--ssc-fg);
      position: relative;
      overflow: hidden;
    }
    .sw.none::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom right,
        transparent calc(50% - 1px),
        var(--ssc-line-strong) calc(50% - 1px),
        var(--ssc-line-strong) calc(50% + 1px),
        transparent calc(50% + 1px)
      );
    }
    .sw.none.sel::after {
      display: none;
    }
    .sw.sel {
      box-shadow: 0 0 0 2px var(--ha-card-background, #1c1c1e), 0 0 0 4px var(--ssc-fg);
    }

    /* ---- the foldable groups ----
       Content stays mounted and collapses, so both directions animate. The
       height rides a plain ease while the CONTENT springs: a height that
       overshoots shoves everything below it and snaps back, which reads as a
       bug, whereas content that overshoots reads as weight. */
    .ed-fold {
      max-height: 0;
      opacity: 0;
      overflow: hidden;
      transition:
        max-height 0.36s var(--ssc-week-ease),
        opacity 0.2s ease;
    }
    .ed-fold.open {
      max-height: 320px;
      opacity: 1;
    }
    /* A fold that can hold an open month grid. max-height is a ceiling, not the
       height, so the only cost of a generous one is that the CLIP finishes
       early - and the spring on .ed-fold-in is what the eye is following. */
    .ed-fold.tall.open {
      max-height: 680px;
    }
    .ed-fold-in {
      transform: translateY(-12px) scale(0.96);
      opacity: 0;
      transition:
        transform 0.44s var(--ssc-spring),
        opacity 0.3s ease;
    }
    .ed-fold.open .ed-fold-in {
      transform: none;
      opacity: 1;
    }
    /* Springs too, rather than turning on a linear ease — it is the one part of
       the row that moves, so it carries the whole gesture. */
    .ed-chev {
      transition: transform 0.44s var(--ssc-spring);
    }

    /* ---- location lookup and its map ---- */
    .ed-row.loc .ed-vals {
      gap: 8px;
    }
    .ed-mapbtn {
      flex: 0 0 auto;
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border: none;
      background: rgba(255, 255, 255, 0.09);
      color: var(--ssc-fg);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition:
        background 0.2s ease,
        transform 0.3s var(--ssc-spring);
    }
    .ed-mapbtn:hover {
      background: rgba(255, 255, 255, 0.16);
    }
    .ed-mapbtn.on {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
      transform: scale(1.06);
    }
    .ed-mapbtn[disabled] {
      opacity: 0.4;
      cursor: default;
    }
    .loc-list {
      display: flex;
      flex-direction: column;
      border-top: 1px solid var(--ssc-line);
      background: rgba(0, 0, 0, 0.18);
      animation: pickerOpen 260ms var(--ssc-week-ease) both;
      overflow: hidden;
    }
    .loc-item {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 48px;
      padding: 8px 12px;
      border: none;
      border-bottom: 1px solid var(--ssc-line);
      background: transparent;
      color: var(--ssc-fg);
      font: inherit;
      text-align: left;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease;
    }
    .loc-item:last-child {
      border-bottom: none;
    }
    .loc-item:hover {
      background: rgba(255, 255, 255, 0.07);
    }
    .loc-item ha-icon {
      flex: 0 0 auto;
      --mdc-icon-size: 20px;
      opacity: 0.6;
    }
    .loc-text {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .loc-name {
      font-size: 15px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .loc-detail {
      font-size: 13px;
      opacity: 0.65;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* The preview. Tiles are absolutely placed inside a clipped box — no map
       library, because the only interaction is "look at it", and Home
       Assistant's own Leaflet comes with CARTO tiles that are stamped
       "API KEY REQUIRED" right across them (verified by rendering ha-map).
       Esri needs no key. */
    .map {
      position: relative;
      height: var(--map-h, 170px);
      overflow: hidden;
      background: #1a1a1e;
    }
    .map-layer {
      position: absolute;
      inset: 0;
    }
    /* Esri's "Dark Gray" basemap is a MID grey — against a card on rgb(32,27,37)
       it reads as a bright slab dropped into the form. Pulled down to the card's
       own darkness, with the label layer pushed the other way so street names
       stay readable through it. */
    .map-layer img {
      position: absolute;
      width: 256px;
      height: 256px;
      filter: brightness(0.42) contrast(1.15) saturate(0.8);
    }
    .map-layer.labels img {
      filter: brightness(1.25) contrast(1.1);
    }
    .map-pin {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 14px;
      height: 14px;
      margin: -7px 0 0 -7px;
      border-radius: 50%;
      background: rgba(255, 71, 51, 1);
      box-shadow:
        0 0 0 3px rgba(255, 255, 255, 0.9),
        0 2px 8px rgba(0, 0, 0, 0.6);
      animation: pinDrop 460ms var(--ssc-spring) both;
    }
    @keyframes pinDrop {
      from {
        transform: translateY(-16px) scale(0.4);
        opacity: 0;
      }
      to {
        transform: none;
        opacity: 1;
      }
    }
    .map-open {
      position: absolute;
      right: 8px;
      top: 8px;
      z-index: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 10px;
      background: rgba(0, 0, 0, 0.72);
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
    }
    .map-open ha-icon {
      --mdc-icon-size: 16px;
    }
    .map-none {
      padding: 18px 12px;
      font-size: 14px;
      opacity: 0.7;
    }

    /* ---- the location picker window ----
       Its own window, not a panel inside the form. Choosing a place on a map is
       a task in itself and it needs room: the inline version was 505x360 and you
       could not get your bearings in it. */
    /* Centred and CAPPED. At inset:3vh 3vw it filled a desktop screen, which put
       its close button right beside the pop-up's own — two X's side by side —
       and made a village map the size of a wall. Big enough to navigate, small
       enough to still read as a window over the card. */
    .mapmodal {
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: min(860px, 92vw);
      height: min(620px, 88vh);
      z-index: 40;
      display: flex;
      flex-direction: column;
      background: var(--ha-card-background, #1c1c1e);
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.7);
      animation: sheetIn 380ms var(--ssc-block-ease) both;
    }
    /* Centred by a FLEX WRAPPER, not by translate(-50%, -50%).
       The window is animated, and a transform keyframe replaces the centring
       one outright — so the panel started each open with its top-left corner ON
       the centre point and flew in from the bottom right. Nothing short of
       repeating the offset in every keyframe fixes that, and then every future
       keyframe has to remember. A wrapper leaves transform free.
       It ignores the pointer so that a tap beside the window still reaches the
       scrim underneath, which is what closes it. */
    .recwrap {
      position: fixed;
      inset: 0;
      z-index: 40;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    /* Sized to its own content rather than to a map: a dialog of six rows has
       no reason to be 620px tall, and Google's is a narrow column. It scrolls
       rather than growing, because the day circles plus an open month grid is
       taller than a phone. */
    .recmodal {
      pointer-events: auto;
      /* Wide enough for "Repeat every [1] [day week month year]" on one line at
         the sizes above; below that .rec-every wraps rather than squashing. */
      width: min(540px, 94vw);
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      background: var(--ha-card-background, #1c1c1e);
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.7);
      transform-origin: center;
      /* BACKWARDS, like the sheet. Fill mode both would pin transform:none
         after the entry and the rubber band could not move it.
         (No backticks in this comment - one ends the css literal.) */
      animation: recIn 420ms var(--ssc-spring) backwards;
    }
    .recwrap.out .recmodal {
      animation: recOut 190ms cubic-bezier(0.4, 0, 1, 1) both;
    }
    /* Rises into place with the overshoot the rest of the card uses, and leaves
       on a plain accelerating ease - an exit that springs reads as arriving. */
    @keyframes recIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(18px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes recOut {
      from {
        opacity: 1;
        transform: none;
      }
      to {
        opacity: 0;
        transform: scale(0.96) translateY(8px);
      }
    }
    .rec-body {
      flex: 1 1 auto;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding-bottom: 4px;
    }
    /* The rule in words, under the controls that built it. Two people have to
       agree here - what you set and what it means - and the second one is the
       only thing that will be true a year from now. */
    .rec-says {
      padding: 14px 12px 4px;
      font-size: 14px;
      font-weight: 600;
      opacity: 0.8;
    }
    /* Collapsed, not dropped, so switching units springs. Same trick as the
       all-day time chip. */
    .rec-days {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.42s var(--ssc-spring);
    }
    .rec-days.open {
      grid-template-rows: 1fr;
    }
    .rec-days-in {
      overflow: hidden;
      min-height: 0;
    }
    .dow-row {
      display: flex;
      gap: 6px;
      padding: 0 12px 10px;
    }
    .dow-btn {
      flex: 1 1 0;
      height: 42px;
      border: 1px solid var(--ssc-line);
      background: transparent;
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition:
        background 0.2s ease,
        transform 0.32s var(--ssc-spring),
        color 0.2s ease;
    }
    .dow-btn.on {
      background: var(--accent);
      border-color: var(--accent);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    .dow-btn:active {
      transform: scale(0.92);
    }
    /* Wraps instead of overlapping. Flex items squashed below their content
       width do not politely shrink here - the stepper is a fixed-size control,
       so the row simply ran the two on top of each other on a narrow card. */
    .rec-every {
      flex-wrap: wrap;
      row-gap: 10px;
    }
    .rec-every .ed-vals {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    /* The unit picker: one control, four states, sized for a finger. */
    .seg {
      display: inline-flex;
      border: 1px solid var(--ssc-line);
    }
    .seg-btn {
      min-width: 52px;
      padding: 0 10px;
      height: 40px;
      border: none;
      border-left: 1px solid var(--ssc-line);
      background: transparent;
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.2s ease;
    }
    .seg-btn:first-child {
      border-left: none;
    }
    /* The accent, exactly as the chosen weekday below it wears it. A grey fill
       reads as "disabled" sitting directly above a pink one, which is the
       opposite of what it means. */
    .seg-btn.on {
      background: var(--accent);
      border-color: var(--accent);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    /* The two monthly shapes are whole phrases, not single words, so this one
       fills the row rather than sitting at its natural width like the unit
       picker above it. */
    .seg.month {
      display: flex;
      margin: 0 12px 10px;
    }
    .seg.month .seg-btn {
      flex: 1 1 0;
      min-width: 0;
      height: 44px;
      white-space: normal;
      line-height: 1.2;
    }
    .stepper {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--ssc-line);
    }
    .st-btn {
      width: 40px;
      height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: var(--ssc-fg);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.2s ease, opacity 0.2s ease;
    }
    .st-btn ha-icon {
      --mdc-icon-size: 18px;
    }
    .st-btn[disabled] {
      opacity: 0.3;
      cursor: default;
    }
    .st-val {
      width: 44px;
      height: 40px;
      border: none;
      border-left: 1px solid var(--ssc-line);
      border-right: 1px solid var(--ssc-line);
      background: transparent;
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 16px;
      font-weight: 700;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
    /* The number is the value the row is about, so it carries the accent too —
       but only while the row it sits in is the live one. The occurrence count
       under an unselected "After" is a number nothing is using. */
    .stepper.on .st-val {
      background: var(--accent);
      color: var(--ssc-today-cell-fg, #16161a);
      border-color: var(--accent);
      font-weight: 700;
    }
    .st-val:focus {
      outline: none;
    }
    .stepper:not(.on) .st-val:focus {
      background: rgba(255, 255, 255, 0.07);
    }
    /* The two Ends rows that carry a control: a DIV, because the value inside
       them is its own button and a button inside a button is not markup. The
       whole row is the target all the same — see the handlers. */
    .ed-row.scope.ends {
      display: flex;
      gap: 10px;
      cursor: pointer;
    }
    .ed-row.scope.ends .ed-lbl {
      flex: 1 1 auto;
      min-width: 0;
    }
    /* Wrapper whose only job is to swallow clicks bound for the row. */
    .stop {
      display: inline-flex;
      align-items: center;
    }
    .ed-sub.occ {
      flex: 0 0 auto;
    }
    /* The Custom row ends in an icon where every row above it ends in a radio,
       and the radio is what carries the margin that pushes it there. */
    .ed-row.scope .ed-chev {
      margin-left: auto;
    }
    /* The form stays put underneath but stops competing for attention. */
    .sheet.editor.behind {
      opacity: 0.25;
      pointer-events: none;
    }
    .mm-head {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 10px 12px 16px;
      border-bottom: 1px solid var(--ssc-line);
    }
    .mm-title {
      flex: 1 1 auto;
      font-size: 17px;
      font-weight: 700;
    }
    .mm-close {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border: none;
      background: transparent;
      color: var(--ssc-fg);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .mm-close:hover {
      background: rgba(255, 255, 255, 0.09);
    }
    /* The map takes every pixel left over. */
    .mm-body {
      flex: 1 1 auto;
      min-height: 0;
      position: relative;
    }
    .mm-body .map {
      position: absolute;
      inset: 0;
      height: auto;
    }
    .mm-foot {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-top: 1px solid var(--ssc-line);
    }
    .mm-addr {
      flex: 1 1 auto;
      min-width: 0;
      font-size: 14px;
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .ed-btn.small ha-icon {
      --mdc-icon-size: 18px;
    }
    a.ed-btn {
      display: grid;
      place-items: center;
      text-decoration: none;
    }
    /* ---- the interactive version ---- */
    .map-canvas {
      position: absolute;
      inset: 0;
    }
    /* NO filter on the live map's tiles. Tinting them to match the card was
       what made it unreadable: on a basemap that is already sparse, dropping it
       to 46% brightness leaves nothing to recognise a place by. A map has to be
       legible before it has to be on-brand. */
    .map.live .leaflet-control-zoom a {
      background: rgba(0, 0, 0, 0.72);
      color: #fff;
      border: none;
    }
    .map.live .leaflet-control-zoom a:hover {
      background: rgba(0, 0, 0, 0.88);
    }
    /* The dropped pin. Draggable, so unlike the static preview's pin it must
       NOT ignore the pointer. */
    .ssc-pin {
      display: grid;
      place-items: center;
      cursor: grab;
    }
    .ssc-pin:active {
      cursor: grabbing;
    }
    .ssc-pin span {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: rgba(255, 71, 51, 1);
      box-shadow:
        0 0 0 3px rgba(255, 255, 255, 0.92),
        0 2px 8px rgba(0, 0, 0, 0.65);
      animation: pinDrop 380ms var(--ssc-spring) both;
    }
    .map.live .leaflet-container {
      cursor: crosshair;
    }
    /* The maps link lives at the TOP right: the form's action bar is sticky and
       overlays the bottom of the map whenever the sheet is not scrolled all the
       way down, which hid anything placed there. */
    /* Attribution, as Esri's terms require. */
    .map-credit {
      position: absolute;
      left: 8px;
      bottom: 8px;
      z-index: 500;
      padding: 3px 7px;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      font-size: 11px;
      pointer-events: none;
    }
    .map-addr {
      flex: 1 1 auto;
      min-width: 0;
      font-size: 13px;
      line-height: 1.3;
      opacity: 0.8;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .ed-btn.small {
      flex: 0 0 auto;
      min-height: 36px;
      padding: 8px 12px;
      font-size: 14px;
    }

    /* ---- the details disclosure ---- */
    .ed-disclose {
      width: 100%;
      box-sizing: border-box;
      border: none;
      background: transparent;
      color: var(--ssc-fg);
      font-family: inherit;
      text-align: left;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .ed-sub {
      flex: 1 1 auto;
      min-width: 0;
      text-align: right;
      font-size: 14px;
      opacity: 0.6;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ed-chev {
      flex: 0 0 auto;
      --mdc-icon-size: 22px;
      opacity: 0.7;
    }
    .ed-chev.open {
      transform: rotate(180deg);
    }

    /* One rule for every text-ish control in the form. The dark scheme is set
       explicitly so any native control comes up dark too, rather than flashing a
       white panel over a dark card. */
    .ed-vals input,
    .ed-row textarea {
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid transparent;
      color: var(--ssc-fg);
      color-scheme: dark;
      font-family: inherit;
      font-size: 15px;
      padding: 7px 9px;
      min-width: 0;
      outline: none;
    }
    .ed-vals input[type='text'] {
      flex: 1 1 auto;
    }
    .ed-vals input:focus,
    .ed-row textarea:focus {
      border-color: var(--accent);
    }
    .ed-row.notes {
      align-items: flex-start;
      padding-top: 10px;
    }
    .ed-row.notes .ed-lbl {
      padding-top: 8px;
    }
    .ed-row textarea {
      flex: 1 1 auto;
      resize: vertical;
      line-height: 1.35;
    }
    .ed-check {
      margin-left: auto;
      width: 20px;
      height: 20px;
      accent-color: var(--accent);
    }
    .ed-row.scope {
      cursor: pointer;
      width: 100%;
      box-sizing: border-box;
      border: none;
      border-top: 1px solid var(--ssc-line);
      background: transparent;
      color: var(--ssc-fg);
      font: inherit;
      text-align: left;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.28s var(--ssc-week-ease);
    }
    .ed-row.scope {
      position: relative;
      overflow: hidden;
    }
    .ed-row.scope.sel {
      background: rgba(255, 255, 255, 0.07);
    }
    /* A scope the current edit has made illegal — see _setRepeat. Dimmed rather
       than removed: a row that vanishes takes the explanation with it. */
    .ed-row.scope.off {
      opacity: 0.35;
      cursor: default;
    }
    /* A bar that wipes down the left edge of the chosen row. This is the part
       that carries the change at a glance — a dot 20px wide at the far right of
       a 400px row is not something the eye catches, however well it springs. */
    .ed-row.scope::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--accent);
      transform: scaleY(0);
      transform-origin: top center;
      transition: transform 0.42s var(--ssc-spring);
    }
    .ed-row.scope.sel::before {
      transform: scaleY(1);
    }
    /* And the label leans in with it. */
    .ed-row.scope .ed-lbl {
      transition:
        transform 0.42s var(--ssc-spring),
        font-weight 0.2s ease;
    }
    .ed-row.scope.sel .ed-lbl {
      transform: translateX(6px);
      font-weight: 700;
    }
    .radio {
      margin-left: auto;
      flex: 0 0 auto;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      box-shadow: inset 0 0 0 2px var(--ssc-line-strong);
      transition:
        box-shadow 0.3s var(--ssc-week-ease),
        transform 0.42s var(--ssc-spring);
    }
    .scope.sel .radio {
      box-shadow: inset 0 0 0 2px var(--accent);
      transform: scale(1.12);
    }
    /* Springs in from nothing and settles past full size. Bigger than before,
       and it rotates as it lands so the arrival has some weight to it. */
    .radio-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--accent);
      transform: scale(0) rotate(-90deg);
      transition: transform 0.46s var(--ssc-spring);
    }
    .scope.sel .radio-dot {
      transform: scale(1) rotate(0deg);
    }
    /* Says in words what the chosen scope will do. The three options differ by
       exactly one word otherwise, and "future" is the one nobody should have to
       guess about - it cannot be undone. */
    /* Ruled off, or it reads as a caption belonging to the last option rather
       than to whichever one is selected. */
    .ed-note {
      padding: 9px 12px 10px;
      border-top: 1px solid var(--ssc-line);
      font-size: 13px;
      line-height: 1.35;
      opacity: 0.8;
      animation: noteIn 360ms var(--ssc-spring) both;
    }
    @keyframes noteIn {
      from {
        opacity: 0;
        transform: translateY(-6px);
      }
      to {
        opacity: 0.8;
        transform: none;
      }
    }
    .ed-error {
      margin-top: 14px;
      padding: 10px 12px;
      background: rgba(255, 71, 51, 0.16);
      border-left: 3px solid rgba(255, 71, 51, 1);
      font-size: 14px;
      line-height: 1.35;
    }
    /* Pinned to the bottom of the sheet, not the bottom of the content. The form
       is taller than a phone once the recurrence options are in it, and Save
       scrolling off the screen is the one thing a form must never do. The
       negative offset and matching padding cancel the sheet's own bottom
       padding, so it sits flush against the edge rather than floating. */
    .ed-actions {
      position: sticky;
      bottom: -18px;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 18px;
      padding: 10px 0 18px;
      background: var(--ha-card-background, #1c1c1e);
      box-shadow: 0 -10px 14px -6px var(--ha-card-background, #1c1c1e);
    }
    .ed-spacer {
      flex: 1 1 auto;
    }
    .ed-btn {
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 15px;
      font-weight: 600;
      padding: 11px 16px;
      min-height: 44px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease;
    }
    .ed-btn:hover {
      background: rgba(255, 255, 255, 0.16);
    }
    .ed-btn[disabled] {
      opacity: 0.5;
      cursor: default;
    }
    /* The same inversion today's heading and the armed week pill use — NOT the
       event's accent. The accent is whatever colour the calendar happens to be,
       and on a red calendar it made Save and Delete the same colour: the one
       pair of buttons in the card that must never be confused for each other. */
    .ed-btn.primary {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
      font-weight: 700;
    }
    .ed-btn.danger {
      background: transparent;
      color: rgba(255, 71, 51, 1);
    }
    /* Armed, after the first press. Filled rather than merely re-labelled: the
       second press is the irreversible one and it should not look like the
       first. */
    .ed-btn.danger.armed {
      background: rgba(255, 71, 51, 1);
      color: #fff;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
    }
    @keyframes sheetIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(10px);
      }
    }

    /* Stillness, gated on a CLASS rather than straight on the media query.

       As a bare @media block there was no way to opt back in: a machine whose OS
       has animations turned off system-wide got a card with no week transition
       and a refresh button whose spinner never span, and no amount of config
       could bring them back. .reduce is put on by _reducedMotion, which reads
       the media query but lets animations:always overrule it.
       (No backticks in this comment: one ends the css template literal.) */
    .panel.reduce .ev,
    .panel.reduce .lr,
    .panel.reduce .sheet,
    .panel.reduce .scrim,
    /* !important, and it has to be. These elements carry their animation-name
       INLINE - the staggered cascade needs a per-element delay and an
       alternating name - and an inline declaration beats any selector. Without
       this, animations: off still animated them; measured, the cells reported
       evInB with reduce on. */
    .panel.reduce .ev,
    .panel.reduce .lr,
    .panel.reduce .mcell,
    .panel.reduce ~ .scrim .cal-day,
    .panel.reduce ~ .scrim .cal-month,
    .panel.reduce .press-ghost {
      animation: none !important;
    }
    .panel.reduce .mcell,
    .panel.reduce .mgrid.dir-fwd .mbody,
    .panel.reduce .mgrid.dir-fwd .mhead,
    .panel.reduce .mgrid.dir-back .mbody,
    .panel.reduce .mgrid.dir-back .mhead,
    .panel.reduce ~ .scrim .daypeek,
    .panel.reduce .daypeek,
    .panel.reduce .grid.dir-fwd .body,
    .panel.reduce .grid.dir-fwd .hdr,
    .panel.reduce .grid.dir-back .body,
    .panel.reduce .grid.dir-back .hdr,
    .panel.reduce .rgrid.dir-fwd .rframe,
    .panel.reduce .rgrid.dir-back .rframe,
    .panel.reduce .list.dir-fwd,
    .panel.reduce .list.dir-back,
    .panel.reduce .range.dir-fwd,
    .panel.reduce .range.dir-back {
      animation: none;
    }
    .panel.reduce .btn.spin ha-icon {
      animation: none;
    }
    /* The edit form's own motion, off with everything else. The chip keeps its
       collapse - it is a layout change, not a flourish - but loses the spring. */
    .panel.reduce ~ .sheet .ed-picker,
    .panel.reduce ~ .sheet .ed-picker > *,
    .panel.reduce ~ .scrim .ed-picker,
    .panel.reduce ~ .scrim .ed-picker > *,
    .panel.reduce ~ .scrim .ed-note,
    .panel.reduce ~ .scrim .cal-day,
    .panel.reduce ~ .scrim .cal-month,
    .panel.reduce ~ .scrim .recmodal,
    .panel.reduce .edit-pill,
    .panel.reduce .add-pill {
      animation: none;
    }
    /* The press ghost keeps its job without the growth: it is an affordance, not
       a flourish, and a press with no feedback at all reads as a dead card. */
    .panel.reduce .press-ghost {
      animation: none;
      opacity: 1;
    }
    .panel.reduce ~ .scrim .radio-dot,
    .panel.reduce ~ .scrim .ed-fold,
    .panel.reduce ~ .scrim .ed-fold-in,
    .panel.reduce ~ .scrim .ed-chip.time,
    .panel.reduce .menu-right,
    .panel.reduce .btn.width-toggle {
      transition: none;
    }
    .panel.reduce .ev-in {
      transition: none;
    }
  `;
_([
  St({ attribute: !1 })
], b.prototype, "hass", 2);
_([
  y()
], b.prototype, "_config", 2);
_([
  y()
], b.prototype, "_sources", 2);
_([
  y()
], b.prototype, "_colors", 2);
_([
  y()
], b.prototype, "_eventColors", 2);
_([
  y()
], b.prototype, "_weekOffset", 2);
_([
  y()
], b.prototype, "_monthOffset", 2);
_([
  y()
], b.prototype, "_now", 2);
_([
  y()
], b.prototype, "_hostWidth", 2);
_([
  y()
], b.prototype, "_refreshing", 2);
_([
  y()
], b.prototype, "_selected", 2);
_([
  y()
], b.prototype, "_navDir", 2);
_([
  y()
], b.prototype, "_activeIdx", 2);
_([
  y()
], b.prototype, "_modeOverride", 2);
_([
  y()
], b.prototype, "_pickerOpen", 2);
_([
  y()
], b.prototype, "_animEpoch", 2);
_([
  y()
], b.prototype, "_hThumb", 2);
_([
  y()
], b.prototype, "_axisPx", 2);
_([
  y()
], b.prototype, "_editMode", 2);
_([
  y()
], b.prototype, "_menuOpen", 2);
_([
  y()
], b.prototype, "_draft", 2);
_([
  y()
], b.prototype, "_scope", 2);
_([
  y()
], b.prototype, "_busy", 2);
_([
  y()
], b.prototype, "_editError", 2);
_([
  y()
], b.prototype, "_confirmDelete", 2);
_([
  y()
], b.prototype, "_dayPeek", 2);
_([
  y()
], b.prototype, "_monthFit", 2);
_([
  y()
], b.prototype, "_monthTight", 2);
_([
  y()
], b.prototype, "_monthLaidOut", 2);
_([
  y()
], b.prototype, "_press", 2);
_([
  y()
], b.prototype, "_openPicker", 2);
_([
  y()
], b.prototype, "_pickerMonth", 2);
_([
  y()
], b.prototype, "_pickerClosing", 2);
_([
  y()
], b.prototype, "_calDir", 2);
_([
  y()
], b.prototype, "_calEpoch", 2);
_([
  y()
], b.prototype, "_detailsOpen", 2);
_([
  y()
], b.prototype, "_colorOpen", 2);
_([
  y()
], b.prototype, "_repeatOpen", 2);
_([
  y()
], b.prototype, "_customOpen", 2);
_([
  y()
], b.prototype, "_custom", 2);
_([
  y()
], b.prototype, "_customClosing", 2);
_([
  y()
], b.prototype, "_endsOpen", 2);
_([
  y()
], b.prototype, "_places", 2);
_([
  y()
], b.prototype, "_placesBusy", 2);
_([
  y()
], b.prototype, "_mapOpen", 2);
_([
  y()
], b.prototype, "_mapPoint", 2);
_([
  y()
], b.prototype, "_baseMap", 2);
_([
  y()
], b.prototype, "_leafletOk", 2);
_([
  y()
], b.prototype, "_flash", 2);
_([
  y()
], b.prototype, "_flashOut", 2);
_([
  y()
], b.prototype, "_revision", 2);
b = _([
  di("simple-schedule-card")
], b);
function vs(e) {
  const t = e.entities ?? (e.entity ? [e.entity] : []), i = [];
  for (const s of t)
    typeof s == "string" ? i.push({ entity: s }) : s && typeof s.entity == "string" && i.push({ ...s });
  return i;
}
function ge(e, t) {
  return `--accent:${e}; --fill:${Ae(e, t)};`;
}
function xs(e) {
  return e.replace(/(^|\s)(\p{L})/gu, (t, i, s) => i + s.toUpperCase());
}
function xt(e) {
  return String(e).padStart(2, "0");
}
const ks = { one: "st", two: "nd", few: "rd", other: "th" };
function $s(e, t) {
  if (t && !t.toLowerCase().startsWith("en")) return "";
  try {
    return ks[new Intl.PluralRules("en", { type: "ordinal" }).select(e)] ?? "";
  } catch {
    return "";
  }
}
function N(e, t) {
  return e.getFullYear() === t.getFullYear() && e.getMonth() === t.getMonth() && e.getDate() === t.getDate();
}
function kt(e, t) {
  return `${(e - t.start) / (t.end - t.start) * 100}%`;
}
function B(e, t) {
  return (e.getTime() - t) / 6e4;
}
window.customCards = window.customCards || [];
window.customCards.push({
  type: "simple-schedule-card",
  name: "Simple Schedule Card",
  description: "A whole week of calendar events as a proportional time grid",
  preview: !1
});
console.info(
  `%c SIMPLE-SCHEDULE-CARD %c v${zi} `,
  "color:#fff;background:#0a84ff;font-weight:700;border-radius:3px 0 0 3px;padding:2px 4px",
  "color:#0a84ff;background:#222;border-radius:0 3px 3px 0;padding:2px 4px"
);
export {
  b as SimpleScheduleCard
};
