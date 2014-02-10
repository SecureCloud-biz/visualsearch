
(function(){var $=jQuery;if(!window.VS)window.VS={};if(!VS.app)VS.app={};if(!VS.ui)VS.ui={};if(!VS.model)VS.model={};if(!VS.utils)VS.utils={};VS.VERSION='0.4.0';VS.VisualSearch=function(options){var defaults={container:'',query:'',autosearch:true,unquotable:[],remainder:'text',showFacets:true,readOnly:false,callbacks:{search:$.noop,focus:$.noop,blur:$.noop,facetMatches:$.noop,valueMatches:$.noop,clearSearch:$.noop,removedFacet:$.noop}};this.options=_.extend({},defaults,options);this.options.callbacks=_.extend({},defaults.callbacks,options.callbacks);VS.app.hotkeys.initialize();this.searchQuery=new VS.model.SearchQuery();this.searchBox=new VS.ui.SearchBox({app:this,showFacets:this.options.showFacets});if(options.container){var searchBox=this.searchBox.render().el;$(this.options.container).html(searchBox);}
this.searchBox.value(this.options.query||'');$(window).bind('unload',function(e){});return this;};VS.init=function(options){return new VS.VisualSearch(options);};})();(function(){var $=jQuery;VS.ui.SearchBox=Backbone.View.extend({id:'search',events:{'click .VS-cancel-search-box':'clearSearch','mousedown .VS-search-box':'maybeFocusSearch','dblclick .VS-search-box':'highlightSearch','click .VS-search-box':'maybeTripleClick'},initialize:function(options){this.options=_.extend({},this.options,options);this.app=this.options.app;this.flags={allSelected:false};this.facetViews=[];this.inputViews=[];_.bindAll(this,'renderFacets','_maybeDisableFacets','disableFacets','deselectAllFacets','addedFacet','removedFacet','changedFacet');this.app.searchQuery.bind('reset',this.renderFacets).bind('add',this.addedFacet).bind('remove',this.removedFacet).bind('change',this.changedFacet);$(document).bind('keydown',this._maybeDisableFacets);},render:function(){$(this.el).append(JST['search_box']({readOnly:this.app.options.readOnly}));$(document.body).setMode('no','search');return this;},value:function(query){if(query==null)return this.serialize();return this.setQuery(query);},serialize:function(){var query=[];var inputViewsCount=this.inputViews.length;this.app.searchQuery.each(_.bind(function(facet,i){query.push(this.inputViews[i].value());query.push(facet.serialize());},this));if(inputViewsCount){query.push(this.inputViews[inputViewsCount-1].value());}
return _.compact(query).join(' ');},selected:function(){return _.select(this.facetViews,function(view){return view.modes.editing=='is'||view.modes.selected=='is';});},selectedModels:function(){return _.pluck(this.selected(),'model');},setQuery:function(query){this.currentQuery=query;VS.app.SearchParser.parse(this.app,query);},viewPosition:function(view){var views=view.type=='facet'?this.facetViews:this.inputViews;var position=_.indexOf(views,view);if(position==-1)position=0;return position;},searchEvent:function(e){var query=this.value();this.focusSearch(e);this.value(query);this.app.options.callbacks.search(query,this.app.searchQuery);},addFacet:function(category,initialQuery,position){category=VS.utils.inflector.trim(category);initialQuery=VS.utils.inflector.trim(initialQuery||'');if(!category)return;var model=new VS.model.SearchFacet({category:category,value:initialQuery||'',app:this.app});this.app.searchQuery.add(model,{at:position});},addedFacet:function(model){this.renderFacets();var facetView=_.detect(this.facetViews,function(view){if(view.model==model)return true;});_.defer(function(){facetView.enableEdit();});},changedFacet:function(){this.renderFacets();},removedFacet:function(facet,query,options){this.app.options.callbacks.removedFacet(facet,query,options);},renderFacets:function(){this.facetViews=[];this.inputViews=[];this.$('.VS-search-inner').empty();this.app.searchQuery.each(_.bind(this.renderFacet,this));this.renderSearchInput();this.renderPlaceholder();},renderFacet:function(facet,position){var view=new VS.ui.SearchFacet({app:this.app,model:facet,order:position});this.renderSearchInput();this.facetViews.push(view);this.$('.VS-search-inner').children().eq(position*2).after(view.render().el);view.calculateSize();_.defer(_.bind(view.calculateSize,view));return view;},renderSearchInput:function(){var input=new VS.ui.SearchInput({position:this.inputViews.length,app:this.app,showFacets:this.options.showFacets});this.$('.VS-search-inner').append(input.render().el);this.inputViews.push(input);},renderPlaceholder:function(){var $placeholder=this.$('.VS-placeholder');if(this.app.searchQuery.length){$placeholder.addClass("VS-hidden");}else{$placeholder.removeClass("VS-hidden").text(this.app.options.placeholder);}},clearSearch:function(e){if(this.app.options.readOnly)return;var actualClearSearch=_.bind(function(){this.disableFacets();this.value('');this.flags.allSelected=false;this.searchEvent(e);this.focusSearch(e);},this);if(this.app.options.callbacks.clearSearch!=$.noop){this.app.options.callbacks.clearSearch(actualClearSearch);}else{actualClearSearch();}},selectAllFacets:function(){this.flags.allSelected=true;$(document).one('click.selectAllFacets',this.deselectAllFacets);_.each(this.facetViews,function(facetView,i){facetView.selectFacet();});_.each(this.inputViews,function(inputView,i){inputView.selectText();});},allSelected:function(deselect){if(deselect)this.flags.allSelected=false;return this.flags.allSelected;},deselectAllFacets:function(e){this.disableFacets();if(this.$(e.target).is('.category,input')){var el=$(e.target).closest('.search_facet,.search_input');var view=_.detect(this.facetViews.concat(this.inputViews),function(v){return v.el==el[0];});if(view.type=='facet'){view.selectFacet();}else if(view.type=='input'){_.defer(function(){view.enableEdit(true);});}}},disableFacets:function(keepView){_.each(this.inputViews,function(view){if(view&&view!=keepView&&(view.modes.editing=='is'||view.modes.selected=='is')){view.disableEdit();}});_.each(this.facetViews,function(view){if(view&&view!=keepView&&(view.modes.editing=='is'||view.modes.selected=='is')){view.disableEdit();view.deselectFacet();}});this.flags.allSelected=false;this.removeFocus();$(document).unbind('click.selectAllFacets');},resizeFacets:function(view){_.each(this.facetViews,function(facetView,i){if(!view||facetView==view){facetView.resize();}});},_maybeDisableFacets:function(e){if(this.flags.allSelected&&VS.app.hotkeys.key(e)=='backspace'){e.preventDefault();this.clearSearch(e);return false;}else if(this.flags.allSelected&&VS.app.hotkeys.printable(e)){this.clearSearch(e);}},focusNextFacet:function(currentView,direction,options){options=options||{};var viewCount=this.facetViews.length;var viewPosition=options.viewPosition||this.viewPosition(currentView);if(!options.skipToFacet){if(currentView.type=='text'&&direction>0)direction-=1;if(currentView.type=='facet'&&direction<0)direction+=1;}else if(options.skipToFacet&&currentView.type=='text'&&viewCount==viewPosition&&direction>=0){return false;}
var view,next=Math.min(viewCount,viewPosition+direction);if(currentView.type=='text'){if(next>=0&&next<viewCount){view=this.facetViews[next];}else if(next==viewCount){view=this.inputViews[this.inputViews.length-1];}
if(view&&options.selectFacet&&view.type=='facet'){view.selectFacet();}else if(view){view.enableEdit();view.setCursorAtEnd(direction||options.startAtEnd);}}else if(currentView.type=='facet'){if(options.skipToFacet){if(next>=viewCount||next<0){view=_.last(this.inputViews);view.enableEdit();}else{view=this.facetViews[next];view.enableEdit();view.setCursorAtEnd(direction||options.startAtEnd);}}else{view=this.inputViews[next];view.enableEdit();}}
if(options.selectText)view.selectText();this.resizeFacets();return true;},maybeFocusSearch:function(e){if(this.app.options.readOnly)return;if($(e.target).is('.VS-search-box')||$(e.target).is('.VS-search-inner')||e.type=='keydown'){this.focusSearch(e);}},focusSearch:function(e,selectText){if(this.app.options.readOnly)return;var view=this.inputViews[this.inputViews.length-1];view.enableEdit(selectText);if(!selectText)view.setCursorAtEnd(-1);if(e.type=='keydown'){view.keydown(e);view.box.trigger('keydown');}
_.defer(_.bind(function(){if(!this.$('input:focus').length){view.enableEdit(selectText);}},this));},highlightSearch:function(e){if(this.app.options.readOnly)return;if($(e.target).is('.VS-search-box')||$(e.target).is('.VS-search-inner')||e.type=='keydown'){var lastinput=this.inputViews[this.inputViews.length-1];lastinput.startTripleClickTimer();this.focusSearch(e,true);}},maybeTripleClick:function(e){var lastinput=this.inputViews[this.inputViews.length-1];return lastinput.maybeTripleClick(e);},addFocus:function(){if(this.app.options.readOnly)return;this.app.options.callbacks.focus();this.$('.VS-search-box').addClass('VS-focus');},removeFocus:function(){this.app.options.callbacks.blur();var focus=_.any(this.facetViews.concat(this.inputViews),function(view){return view.isFocused();});if(!focus)this.$('.VS-search-box').removeClass('VS-focus');},showFacetCategoryMenu:function(e){e.preventDefault();e.stopPropagation();if(this.facetCategoryMenu&&this.facetCategoryMenu.modes.open=='is'){return this.facetCategoryMenu.close();}
var items=[{title:'Account',onClick:_.bind(this.addFacet,this,'account','')},{title:'Project',onClick:_.bind(this.addFacet,this,'project','')},{title:'Filter',onClick:_.bind(this.addFacet,this,'filter','')},{title:'Access',onClick:_.bind(this.addFacet,this,'access','')}];var menu=this.facetCategoryMenu||(this.facetCategoryMenu=new dc.ui.Menu({items:items,standalone:true}));this.$('.VS-icon-search').after(menu.render().open().content);return false;}});})();(function(){var $=jQuery;VS.ui.SearchFacet=Backbone.View.extend({type:'facet',className:'search_facet',events:{'click .category':'selectFacet','keydown input':'keydown','mousedown input':'enableEdit','mouseover .VS-icon-cancel':'showDelete','mouseout .VS-icon-cancel':'hideDelete','click .VS-icon-cancel':'remove'},initialize:function(options){this.options=_.extend({},this.options,options);this.flags={canClose:false};_.bindAll(this,'set','keydown','deselectFacet','deferDisableEdit');this.app=this.options.app;},render:function(){$(this.el).html(JST['search_facet']({model:this.model,readOnly:this.app.options.readOnly}));this.setMode('not','editing');this.setMode('not','selected');this.box=this.$('input');this.box.val(this.model.label());this.box.bind('blur',this.deferDisableEdit);this.box.bind('input propertychange',this.keydown);this.setupAutocomplete();return this;},calculateSize:function(){this.box.autoGrowInput();this.box.unbind('updated.autogrow');this.box.bind('updated.autogrow',_.bind(this.moveAutocomplete,this));},resize:function(e){this.box.trigger('resize.autogrow',e);},setupAutocomplete:function(){this.box.autocomplete({source:_.bind(this.autocompleteValues,this),minLength:0,delay:0,autoFocus:true,position:{offset:"0 5"},create:_.bind(function(e,ui){$(this.el).find('.ui-autocomplete-input').css('z-index','auto');},this),select:_.bind(function(e,ui){e.preventDefault();var originalValue=this.model.get('value');this.set(ui.item.value);if(originalValue!=ui.item.value||this.box.val()!=ui.item.value){if(this.app.options.autosearch){this.search(e);}else{this.app.searchBox.renderFacets();this.app.searchBox.focusNextFacet(this,1,{viewPosition:this.options.order});}}
return false;},this),open:_.bind(function(e,ui){var box=this.box;this.box.autocomplete('widget').find('.ui-menu-item').each(function(){var $value=$(this),autoCompleteData=$value.data('item.autocomplete')||$value.data('ui-autocomplete-item');if(autoCompleteData['value']==box.val()&&box.data('ui-autocomplete').menu.activate){box.data('ui-autocomplete').menu.activate(new $.Event("mouseover"),$value);}});},this)});this.box.autocomplete('widget').addClass('VS-interface');},moveAutocomplete:function(){var autocomplete=this.box.data('ui-autocomplete');if(autocomplete){autocomplete.menu.element.position({my:"left top",at:"left bottom",of:this.box.data('ui-autocomplete').element,collision:"flip",offset:"0 5"});}},searchAutocomplete:function(e){var autocomplete=this.box.data('ui-autocomplete');if(autocomplete){var menu=autocomplete.menu.element;autocomplete.search();menu.outerWidth(Math.max(menu.width('').outerWidth(),autocomplete.element.outerWidth()));}},closeAutocomplete:function(){var autocomplete=this.box.data('ui-autocomplete');if(autocomplete)autocomplete.close();},autocompleteValues:function(req,resp){var category=this.model.get('category');var value=this.model.get('value');var searchTerm=req.term;this.app.options.callbacks.valueMatches(category,searchTerm,function(matches,options){options=options||{};matches=matches||[];if(searchTerm&&value!=searchTerm){if(options.preserveMatches){resp(matches);}else{var re=VS.utils.inflector.escapeRegExp(searchTerm||'');var matcher=new RegExp('\\b'+re,'i');matches=$.grep(matches,function(item){return matcher.test(item)||matcher.test(item.value)||matcher.test(item.label);});}}
if(options.preserveOrder){resp(matches);}else{resp(_.sortBy(matches,function(match){if(match==value||match.value==value)return'';else return match;}));}});},set:function(value){if(!value)return;this.model.set({'value':value});},search:function(e,direction){if(!direction)direction=1;this.closeAutocomplete();this.app.searchBox.searchEvent(e);_.defer(_.bind(function(){this.app.searchBox.focusNextFacet(this,direction,{viewPosition:this.options.order});},this));},enableEdit:function(){if(this.app.options.readOnly)return;if(this.modes.editing!='is'){this.setMode('is','editing');this.deselectFacet();if(this.box.val()==''){this.box.val(this.model.get('value'));}}
this.flags.canClose=false;this.app.searchBox.disableFacets(this);this.app.searchBox.addFocus();_.defer(_.bind(function(){this.app.searchBox.addFocus();},this));this.resize();this.searchAutocomplete();this.box.focus();},deferDisableEdit:function(){this.flags.canClose=true;_.delay(_.bind(function(){if(this.flags.canClose&&!this.box.is(':focus')&&this.modes.editing=='is'&&this.modes.selected!='is'){this.disableEdit();}},this),250);},disableEdit:function(){var newFacetQuery=VS.utils.inflector.trim(this.box.val());if(newFacetQuery!=this.model.get('value')){this.set(newFacetQuery);}
this.flags.canClose=false;this.box.selectRange(0,0);this.box.blur();this.setMode('not','editing');this.closeAutocomplete();this.app.searchBox.removeFocus();},selectFacet:function(e){if(e)e.preventDefault();if(this.app.options.readOnly)return;var allSelected=this.app.searchBox.allSelected();if(this.modes.selected=='is')return;if(this.box.is(':focus')){this.box.setCursorPosition(0);this.box.blur();}
this.flags.canClose=false;this.closeAutocomplete();this.setMode('is','selected');this.setMode('not','editing');if(!allSelected||e){$(document).unbind('keydown.facet',this.keydown);$(document).unbind('click.facet',this.deselectFacet);_.defer(_.bind(function(){$(document).unbind('keydown.facet').bind('keydown.facet',this.keydown);$(document).unbind('click.facet').one('click.facet',this.deselectFacet);},this));this.app.searchBox.disableFacets(this);this.app.searchBox.addFocus();}
return false;},deselectFacet:function(e){if(e)e.preventDefault();if(this.modes.selected=='is'){this.setMode('not','selected');this.closeAutocomplete();this.app.searchBox.removeFocus();}
$(document).unbind('keydown.facet',this.keydown);$(document).unbind('click.facet',this.deselectFacet);return false;},isFocused:function(){return this.box.is(':focus');},showDelete:function(){$(this.el).addClass('search_facet_maybe_delete');},hideDelete:function(){$(this.el).removeClass('search_facet_maybe_delete');},setCursorAtEnd:function(direction){if(direction==-1){this.box.setCursorPosition(this.box.val().length);}else{this.box.setCursorPosition(0);}},remove:function(e){var committed=this.model.get('value');this.deselectFacet();this.disableEdit();this.app.searchQuery.remove(this.model);if(committed&&this.app.options.autosearch){this.search(e,-1);}else{this.app.searchBox.renderFacets();this.app.searchBox.focusNextFacet(this,-1,{viewPosition:this.options.order});}},selectText:function(){this.box.selectRange(0,this.box.val().length);},keydown:function(e){var key=VS.app.hotkeys.key(e);if(key=='enter'&&this.box.val()){this.disableEdit();this.search(e);}else if(key=='left'){if(this.modes.selected=='is'){this.deselectFacet();this.app.searchBox.focusNextFacet(this,-1,{startAtEnd:-1});}else if(this.box.getCursorPosition()==0&&!this.box.getSelection().length){this.selectFacet();}}else if(key=='right'){if(this.modes.selected=='is'){e.preventDefault();this.deselectFacet();this.setCursorAtEnd(0);this.enableEdit();}else if(this.box.getCursorPosition()==this.box.val().length){e.preventDefault();this.disableEdit();this.app.searchBox.focusNextFacet(this,1);}}else if(VS.app.hotkeys.shift&&key=='tab'){e.preventDefault();this.app.searchBox.focusNextFacet(this,-1,{startAtEnd:-1,skipToFacet:true,selectText:true});}else if(key=='tab'){e.preventDefault();this.app.searchBox.focusNextFacet(this,1,{skipToFacet:true,selectText:true});}else if(VS.app.hotkeys.command&&(e.which==97||e.which==65)){e.preventDefault();this.app.searchBox.selectAllFacets();return false;}else if(VS.app.hotkeys.printable(e)&&this.modes.selected=='is'){this.app.searchBox.focusNextFacet(this,-1,{startAtEnd:-1});this.remove(e);}else if(key=='backspace'){$(document).on('keydown.backspace',function(e){if(VS.app.hotkeys.key(e)==='backspace'){e.preventDefault();}});$(document).on('keyup.backspace',function(e){$(document).off('.backspace');});if(this.modes.selected=='is'){e.preventDefault();this.remove(e);}else if(this.box.getCursorPosition()==0&&!this.box.getSelection().length){e.preventDefault();this.selectFacet();}
e.stopPropagation();}
if(e.which==null){_.defer(_.bind(this.resize,this,e));}else{this.resize(e);}}});})();(function(){var $=jQuery;VS.ui.SearchInput=Backbone.View.extend({type:'text',className:'search_input ui-menu',events:{'keypress input':'keypress','keydown input':'keydown','keyup input':'keyup','click input':'maybeTripleClick','dblclick input':'startTripleClickTimer'},initialize:function(options){this.options=_.extend({},this.options,options);this.app=this.options.app;this.flags={canClose:false};_.bindAll(this,'removeFocus','addFocus','moveAutocomplete','deferDisableEdit');},render:function(){$(this.el).html(JST['search_input']({readOnly:this.app.options.readOnly}));this.setMode('not','editing');this.setMode('not','selected');this.box=this.$('input');this.box.autoGrowInput();this.box.bind('updated.autogrow',this.moveAutocomplete);this.box.bind('blur',this.deferDisableEdit);this.box.bind('focus',this.addFocus);this.setupAutocomplete();return this;},setupAutocomplete:function(){this.box.autocomplete({minLength:this.options.showFacets?0:1,delay:50,autoFocus:true,position:{offset:"0 -1"},source:_.bind(this.autocompleteValues,this),focus:function(){return false;},create:_.bind(function(e,ui){$(this.el).find('.ui-autocomplete-input').css('z-index','auto');},this),select:_.bind(function(e,ui){e.preventDefault();var remainder=this.addTextFacetRemainder(ui.item.label||ui.item.value);var position=this.options.position+(remainder?1:0);this.app.searchBox.addFacet(ui.item instanceof String?ui.item:ui.item.value,'',position);return false;},this)});this.box.data('ui-autocomplete')._renderMenu=function(ul,items){var category='';_.each(items,_.bind(function(item,i){if(item.category&&item.category!=category){ul.append('<li class="ui-autocomplete-category">'+item.category+'</li>');category=item.category;}
if(this._renderItemData){this._renderItemData(ul,item);}else{this._renderItem(ul,item);}},this));};this.box.autocomplete('widget').addClass('VS-interface');},autocompleteValues:function(req,resp){var searchTerm=req.term;var lastWord=searchTerm.match(/\w+\*?$/);var re=VS.utils.inflector.escapeRegExp(lastWord&&lastWord[0]||'');this.app.options.callbacks.facetMatches(function(prefixes,options){options=options||{};prefixes=prefixes||[];var matcher=new RegExp('^'+re,'i');var matches=$.grep(prefixes,function(item){return item&&matcher.test(item.label||item);});if(options.preserveOrder){resp(matches);}else{resp(_.sortBy(matches,function(match){if(match.label)return match.category+'-'+match.label;else return match;}));}});},closeAutocomplete:function(){var autocomplete=this.box.data('ui-autocomplete');if(autocomplete)autocomplete.close();},moveAutocomplete:function(){var autocomplete=this.box.data('ui-autocomplete');if(autocomplete){autocomplete.menu.element.position({my:"left top",at:"left bottom",of:this.box.data('ui-autocomplete').element,collision:"none",offset:'0 -1'});}},searchAutocomplete:function(e){var autocomplete=this.box.data('ui-autocomplete');if(autocomplete){var menu=autocomplete.menu.element;autocomplete.search();menu.outerWidth(Math.max(menu.width('').outerWidth(),autocomplete.element.outerWidth()));}},addTextFacetRemainder:function(facetValue){var boxValue=this.box.val();var lastWord=boxValue.match(/\b(\w+)$/);if(!lastWord){return'';}
var matcher=new RegExp(lastWord[0],"i");if(facetValue.search(matcher)==0){boxValue=boxValue.replace(/\b(\w+)$/,'');}
boxValue=boxValue.replace('^\s+|\s+$','');if(boxValue){this.app.searchBox.addFacet(this.app.options.remainder,boxValue,this.options.position);}
return boxValue;},enableEdit:function(selectText){this.addFocus();if(selectText){this.selectText();}
this.box.focus();},addFocus:function(){this.flags.canClose=false;if(!this.app.searchBox.allSelected()){this.app.searchBox.disableFacets(this);}
this.app.searchBox.addFocus();this.setMode('is','editing');this.setMode('not','selected');if(!this.app.searchBox.allSelected()){this.searchAutocomplete();}},disableEdit:function(){this.box.blur();this.removeFocus();},removeFocus:function(){this.flags.canClose=false;this.app.searchBox.removeFocus();this.setMode('not','editing');this.setMode('not','selected');this.closeAutocomplete();},deferDisableEdit:function(){this.flags.canClose=true;_.delay(_.bind(function(){if(this.flags.canClose&&!this.box.is(':focus')&&this.modes.editing=='is'){this.disableEdit();}},this),250);},startTripleClickTimer:function(){this.tripleClickTimer=setTimeout(_.bind(function(){this.tripleClickTimer=null;},this),500);},maybeTripleClick:function(e){if(this.app.options.readOnly)return;if(!!this.tripleClickTimer){e.preventDefault();this.app.searchBox.selectAllFacets();return false;}},isFocused:function(){return this.box.is(':focus');},value:function(){return this.box.val();},setCursorAtEnd:function(direction){if(direction==-1){this.box.setCursorPosition(this.box.val().length);}else{this.box.setCursorPosition(0);}},selectText:function(){this.box.selectRange(0,this.box.val().length);if(!this.app.searchBox.allSelected()){this.box.focus();}else{this.setMode('is','selected');}},search:function(e,direction){if(!direction)direction=0;this.closeAutocomplete();this.app.searchBox.searchEvent(e);_.defer(_.bind(function(){this.app.searchBox.focusNextFacet(this,direction);},this));},keypress:function(e){var key=VS.app.hotkeys.key(e);if(key=='enter'){return this.search(e,100);}else if(VS.app.hotkeys.colon(e)){this.box.trigger('resize.autogrow',e);var query=this.box.val();var prefixes=[];this.app.options.callbacks.facetMatches(function(p){prefixes=p;});var labels=_.map(prefixes,function(prefix){if(prefix.label)return prefix.label;else return prefix;});if(_.contains(labels,query)){e.preventDefault();var remainder=this.addTextFacetRemainder(query);var position=this.options.position+(remainder?1:0);this.app.searchBox.addFacet(query,'',position);return false;}}else if(key=='backspace'){if(this.box.getCursorPosition()==0&&!this.box.getSelection().length){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();this.app.searchBox.resizeFacets();return false;}}},keydown:function(e){var key=VS.app.hotkeys.key(e);if(key=='left'){if(this.box.getCursorPosition()==0){e.preventDefault();this.app.searchBox.focusNextFacet(this,-1,{startAtEnd:-1});}}else if(key=='right'){if(this.box.getCursorPosition()==this.box.val().length){e.preventDefault();this.app.searchBox.focusNextFacet(this,1,{selectFacet:true});}}else if(VS.app.hotkeys.shift&&key=='tab'){e.preventDefault();this.app.searchBox.focusNextFacet(this,-1,{selectText:true});}else if(key=='tab'){var value=this.box.val();if(value.length){e.preventDefault();var remainder=this.addTextFacetRemainder(value);var position=this.options.position+(remainder?1:0);if(value!=remainder){this.app.searchBox.addFacet(value,'',position);}}else{var foundFacet=this.app.searchBox.focusNextFacet(this,0,{skipToFacet:true,selectText:true});if(foundFacet){e.preventDefault();}}}else if(VS.app.hotkeys.command&&String.fromCharCode(e.which).toLowerCase()=='a'){e.preventDefault();this.app.searchBox.selectAllFacets();return false;}else if(key=='backspace'&&!this.app.searchBox.allSelected()){if(this.box.getCursorPosition()==0&&!this.box.getSelection().length){e.preventDefault();this.app.searchBox.focusNextFacet(this,-1,{backspace:true});return false;}}else if(key=='end'){var view=this.app.searchBox.inputViews[this.app.searchBox.inputViews.length-1];view.setCursorAtEnd(-1);}else if(key=='home'){var view=this.app.searchBox.inputViews[0];view.setCursorAtEnd(-1);}},keyup:function(e){this.box.trigger('resize.autogrow',e);}});})();(function(){var $=jQuery;Backbone.View.prototype.setMode=function(mode,group){this.modes||(this.modes={});if(this.modes[group]===mode)return;$(this.el).setMode(mode,group);this.modes[group]=mode;};})();(function(){var $=jQuery;VS.app.hotkeys={KEYS:{'16':'shift','17':'command','91':'command','93':'command','224':'command','13':'enter','37':'left','38':'upArrow','39':'right','40':'downArrow','46':'delete','8':'backspace','35':'end','36':'home','9':'tab','188':'comma'},initialize:function(){_.bindAll(this,'down','up','blur');$(document).bind('keydown',this.down);$(document).bind('keyup',this.up);$(window).bind('blur',this.blur);},down:function(e){var key=this.KEYS[e.which];if(key)this[key]=true;},up:function(e){var key=this.KEYS[e.which];if(key)this[key]=false;},blur:function(e){for(var key in this.KEYS)this[this.KEYS[key]]=false;},key:function(e){return this.KEYS[e.which];},colon:function(e){var charCode=e.which;return charCode&&String.fromCharCode(charCode)==":";},printable:function(e){var code=e.which;if(e.type=='keydown'){if(code==32||(code>=48&&code<=90)||(code>=96&&code<=111)||(code>=186&&code<=192)||(code>=219&&code<=222)){return true;}}else{if((code>=32&&code<=126)||(code>=160&&code<=500)||(String.fromCharCode(code)==":")){return true;}}
return false;}};})();(function(){var $=jQuery;VS.utils.inflector={trim:function(s){return s.trim?s.trim():s.replace(/^\s+|\s+$/g,'');},escapeRegExp:function(s){return s.replace(/([.*+?^${}()|[\]\/\\])/g,'\\$1');}};})();(function(){var $=jQuery;$.fn.extend({setMode:function(state,group){group=group||'mode';var re=new RegExp("\\w+_"+group+"(\\s|$)",'g');var mode=(state===null)?"":state+"_"+group;this.each(function(){this.className=(this.className.replace(re,'')+' '+mode).replace(/\s\s/g,' ');});return mode;},autoGrowInput:function(){return this.each(function(){var $input=$(this);var $tester=$('<div />').css({opacity:0,top:-9999,left:-9999,position:'absolute',whiteSpace:'nowrap'}).addClass('VS-input-width-tester').addClass('VS-interface');var events='keydown.autogrow keypress.autogrow '+'resize.autogrow change.autogrow';$input.next('.VS-input-width-tester').remove();$input.after($tester);$input.unbind(events).bind(events,function(e,realEvent){if(realEvent)e=realEvent;var value=$input.val();if(VS.app.hotkeys.key(e)=='backspace'){var position=$input.getCursorPosition();if(position>0)value=value.slice(0,position-1)+
value.slice(position,value.length);}else if(VS.app.hotkeys.printable(e)&&!VS.app.hotkeys.command){value+=String.fromCharCode(e.which);}
value=value.replace(/&/g,'&amp;').replace(/\s/g,'&nbsp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');$tester.html(value);$input.width($tester.width()+3+parseInt($input.css('min-width')));$input.trigger('updated.autogrow');});$input.trigger('resize.autogrow');});},getCursorPosition:function(){var position=0;var input=this.get(0);if(document.selection){input.focus();var sel=document.selection.createRange();var selLen=document.selection.createRange().text.length;sel.moveStart('character',-input.value.length);position=sel.text.length-selLen;}else if(input&&$(input).is(':visible')&&input.selectionStart!=null){position=input.selectionStart;}
return position;},setCursorPosition:function(position){return this.each(function(){return $(this).selectRange(position,position);});},selectRange:function(start,end){return this.filter(':visible').each(function(){if(this.setSelectionRange){this.focus();this.setSelectionRange(start,end);}else if(this.createTextRange){var range=this.createTextRange();range.collapse(true);range.moveEnd('character',end);range.moveStart('character',start);if(end-start>=0)range.select();}});},getSelection:function(){var input=this[0];if(input.selectionStart!=null){var start=input.selectionStart;var end=input.selectionEnd;return{start:start,end:end,length:end-start,text:input.value.substr(start,end-start)};}else if(document.selection){var range=document.selection.createRange();if(range){var textRange=input.createTextRange();var copyRange=textRange.duplicate();textRange.moveToBookmark(range.getBookmark());copyRange.setEndPoint('EndToStart',textRange);var start=copyRange.text.length;var end=start+range.text.length;return{start:start,end:end,length:end-start,text:range.text};}}
return{start:0,end:0,length:0};}});if(false){window.console={};var _$ied;window.console.log=function(msg){if(_.isArray(msg)){var message=msg[0];var vars=_.map(msg.slice(1),function(arg){return JSON.stringify(arg);}).join(' - ');}
if(!_$ied){_$ied=$('<div><ol></ol></div>').css({'position':'fixed','bottom':10,'left':10,'zIndex':20000,'width':$('body').width()-80,'border':'1px solid #000','padding':'10px','backgroundColor':'#fff','fontFamily':'arial,helvetica,sans-serif','fontSize':'11px'});$('body').append(_$ied);}
var $message=$('<li>'+message+' - '+vars+'</li>').css({'borderBottom':'1px solid #999999'});_$ied.find('ol').append($message);_.delay(function(){$message.fadeOut(500);},5000);};}})();(function(){var $=jQuery;var QUOTES_RE="('[^']+'|\"[^\"]+\")";var FREETEXT_RE="('[^']+'|\"[^\"]+\"|[^'\"\\s]\\S*)";var CATEGORY_RE=FREETEXT_RE+':\\s*';VS.app.SearchParser={ALL_FIELDS:new RegExp(CATEGORY_RE+FREETEXT_RE,'g'),CATEGORY:new RegExp(CATEGORY_RE),parse:function(instance,query){var searchFacets=this._extractAllFacets(instance,query);instance.searchQuery.reset(searchFacets);return searchFacets;},_extractAllFacets:function(instance,query){var facets=[];var originalQuery=query;while(query){var category,value;originalQuery=query;var field=this._extractNextField(query);if(!field){category=instance.options.remainder;value=this._extractSearchText(query);query=VS.utils.inflector.trim(query.replace(value,''));}else if(field.indexOf(':')!=-1){category=field.match(this.CATEGORY)[1].replace(/(^['"]|['"]$)/g,'');value=field.replace(this.CATEGORY,'').replace(/(^['"]|['"]$)/g,'');query=VS.utils.inflector.trim(query.replace(field,''));}else if(field.indexOf(':')==-1){category=instance.options.remainder;value=field;query=VS.utils.inflector.trim(query.replace(value,''));}
if(category&&value){var searchFacet=new VS.model.SearchFacet({category:category,value:VS.utils.inflector.trim(value),app:instance});facets.push(searchFacet);}
if(originalQuery==query)break;}
return facets;},_extractNextField:function(query){var textRe=new RegExp('^\\s*(\\S+)\\s+(?='+QUOTES_RE+FREETEXT_RE+')');var textMatch=query.match(textRe);if(textMatch&&textMatch.length>=1){return textMatch[1];}else{return this._extractFirstField(query);}},_extractFirstField:function(query){var fields=query.match(this.ALL_FIELDS);return fields&&fields.length&&fields[0];},_extractSearchText:function(query){query=query||'';var text=VS.utils.inflector.trim(query.replace(this.ALL_FIELDS,''));return text;}};})();(function(){var $=jQuery;VS.model.SearchFacet=Backbone.Model.extend({serialize:function(){var category=this.quoteCategory(this.get('category'));var value=VS.utils.inflector.trim(this.get('value'));var remainder=this.get("app").options.remainder;if(!value)return'';if(!_.contains(this.get("app").options.unquotable||[],category)&&category!=remainder){value=this.quoteValue(value);}
if(category!=remainder){category=category+': ';}else{category="";}
return category+value;},quoteCategory:function(category){var hasDoubleQuote=(/"/).test(category);var hasSingleQuote=(/'/).test(category);var hasSpace=(/\s/).test(category);if(hasDoubleQuote&&!hasSingleQuote){return"'"+category+"'";}else if(hasSpace||(hasSingleQuote&&!hasDoubleQuote)){return'"'+category+'"';}else{return category;}},quoteValue:function(value){var hasDoubleQuote=(/"/).test(value);var hasSingleQuote=(/'/).test(value);if(hasDoubleQuote&&!hasSingleQuote){return"'"+value+"'";}else{return'"'+value+'"';}},label:function(){return this.get('label')||this.get('value');}});})();(function(){var $=jQuery;VS.model.SearchQuery=Backbone.Collection.extend({model:VS.model.SearchFacet,serialize:function(){return this.map(function(facet){return facet.serialize();}).join(' ');},facets:function(){return this.map(function(facet){var value={};value[facet.get('category')]=facet.get('value');return value;});},find:function(category){var facet=this.detect(function(facet){return facet.get('category').toLowerCase()==category.toLowerCase();});return facet&&facet.get('value');},count:function(category){return this.select(function(facet){return facet.get('category').toLowerCase()==category.toLowerCase();}).length;},values:function(category){var facets=this.select(function(facet){return facet.get('category').toLowerCase()==category.toLowerCase();});return _.map(facets,function(facet){return facet.get('value');});},has:function(category,value){return this.any(function(facet){var categoryMatched=facet.get('category').toLowerCase()==category.toLowerCase();if(!value)return categoryMatched;return categoryMatched&&facet.get('value')==value;});},withoutCategory:function(){var categories=_.map(_.toArray(arguments),function(cat){return cat.toLowerCase();});return this.map(function(facet){if(!_.include(categories,facet.get('category').toLowerCase())){return facet.serialize();};}).join(' ');}});})();(function(){window.JST=window.JST||{};window.JST['search_box']=_.template('<div class="VS-search <% if (readOnly) { %>VS-readonly<% } %>">\n  <div class="VS-search-box-wrapper VS-search-box">\n    <div class="VS-icon VS-icon-search"></div>\n    <div class="VS-placeholder"></div>\n    <div class="VS-search-inner"></div>\n    <div class="VS-icon VS-icon-cancel VS-cancel-search-box" title="clear search"></div>\n  </div>\n</div>');window.JST['search_facet']=_.template('<% if (model.has(\'category\')) { %>\n  <div class="category"><%= model.get(\'category\') %>:</div>\n<% } %>\n\n<div class="search_facet_input_container">\n  <input type="text" class="search_facet_input ui-menu VS-interface" value="" <% if (readOnly) { %>disabled="disabled"<% } %> />\n</div>\n\n<div class="search_facet_remove VS-icon VS-icon-cancel"></div>');window.JST['search_input']=_.template('<input type="text" class="ui-menu" <% if (readOnly) { %>disabled="disabled"<% } %> />');})();