/**
 * selectpicker-propagation.js
 * Copyright (c) 2019 KOMEKOME Party (k2party)
 */
;(function($) {
	/**
	 * Class: PropagationTarget
	 * 伝搬先のコンポーネントに適用するクラス。
	 * 伝搬先での選択肢の取得、再描画を行う。
	 */
	var PropagationTarget = function($target, options) {
		this._$target = $target;
		this._options = $.extend({
			selectAjax: null,
			selectpickerRefresh: 'refresh',
			selectpicker: null,
		}, options);
		
		if(typeof this._options.selectAjax == 'string') {
			this._options.selectAjax = {
				url: this._options.selectAjax,
			};
		}
		
		// options.selectpickerRefreshがtrueの場合は'refresh'とする
		if(this._options.selectpickerRefresh === true) {
			this._options.selectpickerRefresh = 'refresh';
		}
		
		// data-group属性を持つoptionを保持
		this._$children = $target.children('option[data-group]').clone();

		// propagation.k2party.selectpickerイベントリスナーを登録
		this._$target.on('propagation.k2party.selectpicker', this._on_propagation);
	};
	
	PropagationTarget.prototype = {
		_on_propagation: function(jqEvent, parameters)
		{
			// thisはdata-select-propagation属性で指定された要素（DOMエレメント）なので
			// _propagation_targetプロパティが注入されている
			var propagation_target = this._propagation_target;
			if(propagation_target == undefined) {
				// なかったら終了
				console.error('PropagationTarget: non injected', this);
				return;
			}

			// イベントのパラメタから現在値を取得
			var value = parameters.value;
			var promise = null;
			
			if(propagation_target._options.selectAjax != null
					&& typeof propagation_target._options.selectAjax == 'object') {
				// data-select-ajax属性が指定されている場合、ajax実行
				promise = propagation_target._redraw_ajax(value);
			}
			else {
				// ajaxでない場合、option[data-group=xxxx]を取得して入れ替える
				promise = propagation_target._redraw(value);
			}
			
			// option更新後の処理
			promise.done(function() {
				// selectpickerを更新
				if(propagation_target._options.selectpickerRefresh != false
						&& propagation_target._options.selectpickerRefresh != ''
						&& propagation_target._options.selectpicker != null) {
					propagation_target._$target.selectpicker(propagation_target._options.selectpickerRefresh);
				}

				// 更に次のselectへ連携する場合、イベント通知する
				var propagation = propagation_target._$target.prop('_propagation'); 
				if(propagation != undefined) {
					propagation.propagate(parameters);
				}
			});
		},
		
		_redraw_ajax: function(value)
		{
			var propagation_target = this;
			return $.ajax($.extend({
				type: 'get',
				dataType: 'json',
				data: {
					q: value,
				},
			}, this._options.selectAjax))
			.fail(function(error) {
				console.error(error);
			})
			.done(function(result) {
				// ajax実行後（正常時）、ドロップダウンリストの内容を再構築する
				var html = '';
				result.data.forEach(function(data) {
					var option = [data, data];
					var matcher = data.match(/^([^\s]*)\s+(.*)$/);
					if(matcher != null) {
						option = [matcher[1], matcher[2]];
					}
					html += '<option value="'+ option[0] + '">' + option[1] + '</option>';
				});
				propagation_target._$target.html(html);
			});
		},
		
		_redraw: function(value)
		{
			var propagation_target = this;
			return $.Deferred(function() {
				var $children = propagation_target._$children.clone();
				if(value == undefined || value == null || value == '') {
					value = '""';
				}
				if(value != '*') {
					$children = $children.filter('[data-group=' + value + ']'); 
				}
				propagation_target._$target.children('[data-group]').remove();
				propagation_target._$target.append($children);
				
				this.resolve();
			});
		},
	};
	
	/**
	 * Class: PropagationPropagator
	 * 伝搬元のコンポーネントに適用するクラス。
	 * 伝搬元のイベントリスニング、伝搬先へのイベント伝達を行う
	 */
	var PropagationPropagator = function($target, options) {
		this._$target = $target;
		this._$propagations = null;
		this._options = $.extend({
			selectPropagation: null,
			selectTrigger: 'change',
		}, options);
		
		if(this._options.selectPropagation != null) {
			this._$propagations = $(this._options.selectPropagation);
			this._$propagations.each(function() {
				this._propagation_target = new PropagationTarget($(this), $(this).data()); 
			});
		}
		
		// イベントリスナーを登録
		this._$target.on(this._options.selectTrigger, this._on_change);
	};

	PropagationPropagator.prototype = {
		propagate: function(origin)
		{
			var parameter = {
				source: origin? origin.source:this._$target,
				sourceEvent: origin? origin.sourceEvent:undefined,
				value: this._$target.val(),
			};
			this._$propagations.triggerHandler('propagation.k2party.selectpicker', parameter);
		},
		
		_on_change: function(jqEvent)
		{
			var parameter = {
				source: $(this),
				sourceEvent: jqEvent,
				value: $(this).val(),
			};
			this._propagation._$propagations.triggerHandler('propagation.k2party.selectpicker', parameter);
		},
	};
	
	jQuery.fn.propagation = function() {
		var args = Array.prototype.slice.call(arguments);
		if(args.length == 0 || typeof args[0] == 'object') {
			this.each(function(index, target) {
				target._propagation = new PropagationPropagator($(target), args[0]);
				target._propagation.propagate();
			});
			return this;
		}
		
		var cmd = args.shift();
		if(cmd.charAt(0) != '_' && typeof PropagationPropagator.prototype[cmd] == 'function') {
			this.each(function(index, target) {
				PropagationPropagator.prototype[cmd].apply(target._propagatorion, args);
			});
			return this;
		}
		
		if(typeof PropagationPropagator.prototype['__' + cmd] == 'function') {
			var results = this.map(function(index, target) {
				return PropagationPropagator.prototype['__' + cmd].apply(target._propagation, args);
			});
			return (results.length > 1)? results:results[0];
		}
	
		throw new Error('PropagationPropagator: command "{cmd}" does not exist.'.replace('{cmd}', cmd));
	};
})(jQuery);
