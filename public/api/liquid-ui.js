(function () {
  'use strict';

  var ROOT_SELECTOR = '[data-liquid-glass="enabled"]';
  var selectInstances = new Map();
  var openControl = null;
  var scanQueued = false;

  function getRoot() {
    return document.querySelector(ROOT_SELECTOR);
  }

  function closeOpenControl(except) {
    if (openControl && openControl !== except) openControl.close();
  }

  function isInsideOpenControl(target) {
    return Boolean(openControl && (openControl.contains(target) || openControl.trigger.contains(target)));
  }

  function dispatchNativeChange(select) {
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function optionLabel(select) {
    var selected = select.options[select.selectedIndex];
    return selected ? selected.textContent.trim() : '';
  }

  function SelectEnhancement(select) {
    if (select.__liquidSelect || select.multiple || select.size > 1) return;

    select.__liquidSelect = this;
    this.select = select;
    this.id = 'lq-panel-' + Math.random().toString(36).slice(2, 10);

    this.trigger = document.createElement('button');
    this.trigger.type = 'button';
    this.trigger.className = 'lq-trigger';
    this.trigger.setAttribute('aria-haspopup', 'listbox');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.trigger.setAttribute('aria-controls', this.id);

    this.label = document.createElement('span');
    this.label.className = 'lq-trigger-label';
    this.chevron = document.createElement('span');
    this.chevron.className = 'lq-trigger-chev';
    this.chevron.setAttribute('aria-hidden', 'true');
    // A stroked SVG, not the '⌄' character: the glyph renders at a different
    // weight and baseline in every font and read as a stray lowercase v.
    this.chevron.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 9l-7 7-7-7"/></svg>';
    this.trigger.append(this.label, this.chevron);

    this.panel = document.createElement('div');
    this.panel.id = this.id;
    this.panel.className = 'lq-panel';
    this.panel.dataset.liquidOwned = 'true';
    this.panel.setAttribute('role', 'listbox');

    select.classList.add('lq-native-source');
    select.setAttribute('aria-hidden', 'true');
    select.tabIndex = -1;
    select.insertAdjacentElement('afterend', this.trigger);
    document.body.appendChild(this.panel);

    this.handleTrigger = this.toggle.bind(this);
    this.handleNativeChange = this.sync.bind(this);
    this.handleFormReset = this.handleFormReset.bind(this);
    this.trigger.addEventListener('click', this.handleTrigger);
    select.addEventListener('change', this.handleNativeChange);
    if (select.form) select.form.addEventListener('reset', this.handleFormReset);

    this.optionObserver = new MutationObserver(this.sync.bind(this));
    this.optionObserver.observe(select, { childList: true, subtree: true, characterData: true, attributes: true });
    this.sync();
  }

  SelectEnhancement.prototype.contains = function (target) {
    return this.panel.contains(target);
  };

  SelectEnhancement.prototype.handleFormReset = function () {
    var self = this;
    setTimeout(function () { self.sync(); }, 0);
  };

  SelectEnhancement.prototype.sync = function () {
    this.label.textContent = optionLabel(this.select);
    this.trigger.disabled = this.select.disabled;
    this.trigger.setAttribute('aria-label', this.select.getAttribute('aria-label') || this.select.name || optionLabel(this.select));
    if (this.panel.classList.contains('lq-open')) this.renderOptions();
  };

  SelectEnhancement.prototype.renderOptions = function () {
    var self = this;
    var options = Array.from(this.select.options);
    this.panel.replaceChildren();

    if (options.length > 8) {
      var searchWrap = document.createElement('div');
      searchWrap.className = 'lq-panel-search-wrap';
      var search = document.createElement('input');
      search.type = 'search';
      search.className = 'lq-panel-search';
      search.placeholder = document.documentElement.lang === 'it' ? 'Cerca...' : document.documentElement.lang === 'en' ? 'Search...' : 'Ara...';
      search.setAttribute('aria-label', search.placeholder);
      searchWrap.appendChild(search);
      this.panel.appendChild(searchWrap);
      search.addEventListener('input', function () {
        var query = search.value.toLocaleLowerCase(document.documentElement.lang || undefined);
        self.panel.querySelectorAll('.lq-opt').forEach(function (row) {
          row.hidden = !row.textContent.toLocaleLowerCase(document.documentElement.lang || undefined).includes(query);
        });
      });
      this.search = search;
    } else {
      this.search = null;
    }

    options.forEach(function (option, index) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'lq-opt';
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(option.selected));
      row.disabled = option.disabled;
      row.style.animationDelay = index * 18 + 'ms';

      var text = document.createElement('span');
      text.textContent = option.textContent;
      row.appendChild(text);
      if (option.selected) {
        var check = document.createElement('span');
        check.setAttribute('aria-hidden', 'true');
        check.textContent = '✓';
        row.appendChild(check);
      }

      row.addEventListener('click', function () {
        if (option.disabled) return;
        self.select.value = option.value;
        dispatchNativeChange(self.select);
        self.sync();
        self.close();
        self.trigger.focus();
      });
      self.panel.appendChild(row);
    });
  };

  SelectEnhancement.prototype.position = function () {
    if (!this.panel.classList.contains('lq-open')) return;
    var rect = this.trigger.getBoundingClientRect();
    var gap = 8;
    var viewportGap = 10;
    var desiredHeight = Math.min(this.panel.scrollHeight, 320);
    var spaceBelow = window.innerHeight - rect.bottom - viewportGap;
    var spaceAbove = rect.top - viewportGap;
    var flip = spaceBelow < Math.min(desiredHeight, 180) && spaceAbove > spaceBelow;
    var available = Math.max(120, flip ? spaceAbove - gap : spaceBelow - gap);
    var width = Math.max(rect.width, 180);
    var left = Math.min(Math.max(viewportGap, rect.left), window.innerWidth - width - viewportGap);

    this.panel.classList.toggle('lq-flip', flip);
    this.panel.style.width = width + 'px';
    this.panel.style.maxHeight = Math.min(320, available) + 'px';
    this.panel.style.left = left + 'px';
    this.panel.style.top = flip
      ? Math.max(viewportGap, rect.top - Math.min(desiredHeight, available) - gap) + 'px'
      : rect.bottom + gap + 'px';
  };

  SelectEnhancement.prototype.open = function () {
    if (this.select.disabled) return;
    closeOpenControl(this);
    this.renderOptions();
    this.panel.classList.add('lq-open');
    this.trigger.classList.add('lq-active');
    this.trigger.setAttribute('aria-expanded', 'true');
    openControl = this;
    this.position();
    if (this.search) this.search.focus({ preventScroll: true });
  };

  SelectEnhancement.prototype.close = function () {
    this.panel.classList.remove('lq-open', 'lq-flip');
    this.trigger.classList.remove('lq-active');
    this.trigger.setAttribute('aria-expanded', 'false');
    if (openControl === this) openControl = null;
  };

  SelectEnhancement.prototype.toggle = function () {
    if (this.panel.classList.contains('lq-open')) this.close();
    else this.open();
  };

  SelectEnhancement.prototype.destroy = function () {
    this.close();
    this.optionObserver.disconnect();
    this.trigger.removeEventListener('click', this.handleTrigger);
    this.select.removeEventListener('change', this.handleNativeChange);
    if (this.select.form) this.select.form.removeEventListener('reset', this.handleFormReset);
    this.trigger.remove();
    this.panel.remove();
    this.select.classList.remove('lq-native-source');
    this.select.removeAttribute('aria-hidden');
    this.select.removeAttribute('tabindex');
    delete this.select.__liquidSelect;
  };

  function activeItem(element) {
    if (element.getAttribute('aria-checked') === 'true') return true;
    if (element.getAttribute('aria-selected') === 'true') return true;
    if (element.getAttribute('aria-current') === 'page') return true;
    if (element.classList.contains('active')) return true;
    if (element.className.indexOf('bg-white/15') !== -1) return true;
    if (element.tagName === 'A') {
      var href = element.getAttribute('href');
      return href === window.location.pathname || (href !== '/' && window.location.pathname.indexOf(href + '/') === 0);
    }
    return false;
  }

  function Segment(container, itemSelector) {
    if (container.__seg) return;
    var items = container.querySelectorAll(itemSelector);
    if (items.length < 2) return;

    container.__seg = this;
    this.el = container;
    this.itemSel = itemSelector;
    container.classList.add('seg-container', 'seg-ready');

    var indicator = document.createElement('span');
    indicator.className = 'seg-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    container.insertBefore(indicator, container.firstChild);
    this.ind = indicator;

    var self = this;
    this.mutationObserver = new MutationObserver(function (records) {
      if (records.some(function (record) { return record.target !== indicator; })) self.update(false);
    });
    this.mutationObserver.observe(container, { attributes: true, attributeFilter: ['class', 'style', 'aria-checked', 'aria-selected', 'aria-current'], subtree: true });

    this.resizeObserver = new ResizeObserver(function () { self.update(true); });
    this.resizeObserver.observe(container);
    window.addEventListener('resize', function () { self.update(true); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { self.update(true); });
    window.addEventListener('load', function () { self.update(true); });
    [120, 400, 1200].forEach(function (ms) { setTimeout(function () { self.update(true); }, ms); });
    this.update(true);
  }

  Segment.prototype.update = function (instant) {
    var active = Array.from(this.el.querySelectorAll(this.itemSel)).find(activeItem);
    if (!active || active.offsetParent === null) {
      this.ind.style.opacity = '0';
      return;
    }

    if (instant) this.ind.style.transition = 'none';
    this.ind.style.opacity = '1';
    this.ind.style.width = active.offsetWidth + 'px';
    this.ind.style.height = active.offsetHeight + 'px';
    this.ind.style.transform = 'translate(' + active.offsetLeft + 'px,' + active.offsetTop + 'px)';
    if (instant) {
      void this.ind.offsetWidth;
      this.ind.style.transition = '';
    }
  };

  function enhanceSelects(root) {
    root.querySelectorAll('select:not(.lq-native-source)').forEach(function (select) {
      if (select.multiple || select.size > 1 || select.closest('[data-liquid-skip]')) return;
      var instance = new SelectEnhancement(select);
      if (select.__liquidSelect) selectInstances.set(select, instance);
    });
  }

  function enhanceSegments(root) {
    root.querySelectorAll('[role="radiogroup"]').forEach(function (group) { new Segment(group, '[role="radio"]'); });
    root.querySelectorAll('[role="tablist"]').forEach(function (group) { new Segment(group, '[role="tab"]'); });
    root.querySelectorAll('aside nav').forEach(function (group) { new Segment(group, ':scope > a'); });
  }

  function cleanupDetachedSelects(root) {
    selectInstances.forEach(function (instance, select) {
      if (!root || !select.isConnected || !root.contains(select)) {
        instance.destroy();
        selectInstances.delete(select);
      }
    });
  }

  function scan() {
    scanQueued = false;
    var root = getRoot();
    cleanupDetachedSelects(root);
    if (!root) return;
    enhanceSelects(root);
    enhanceSegments(root);
  }

  function queueScan() {
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(scan);
  }

  document.addEventListener('mousedown', function (event) {
    if (openControl && !isInsideOpenControl(event.target)) openControl.close();
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && openControl) {
      var trigger = openControl.trigger;
      openControl.close();
      trigger.focus();
    }
  });

  window.addEventListener('resize', function () { if (openControl) openControl.position(); });
  window.addEventListener('scroll', function () { if (openControl) openControl.position(); }, true);

  function start() {
    scan();
    new MutationObserver(queueScan).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
