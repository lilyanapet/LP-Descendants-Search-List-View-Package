angular.module('umbraco').controller('My.ListView.Layout.CustomListViewLayoutController', function ($scope, $routeParams, $location, $filter, $injector, appState, $timeout, editorState, treeService, listViewHelper, localizationService, navigationService, notificationsService, $http) {
    $scope.selectedIds = [];

    $scope.currentPage = 1;
    $scope.itemsPerPage = 10;

    $scope.viewLoaded = false;

    $scope.searchTerm = "";

    $scope.actionInProgress = false;
    //when this is null, we don't check permissions
    $scope.buttonPermissions = null;

    var contentResource = $injector.get('contentResource');

    angular.forEach(editorState.current.tabs, function (value, key) {
        if (value.active === true && value.properties[0].config.tabName === 'Items Table') {
            
                $scope.options = {
                    displayAtTabNumber: value.properties[0].config.displayAtTabNumber,
                    pageSize: parseInt(value.properties[0].config.pageSize) > 0 ? parseInt(value.properties[0].config.pageSize) : $scope.itemsPerPage,
                    pageNumber: parseInt($routeParams.page) > 0 ? $routeParams.page : 1,
                    filter: '',
                    orderBy: value.properties[0].config.orderBy,
                    orderDirection: value.properties[0].config.orderDirection,
                    orderBySystemField: true,
                    allowBulkPublish: $scope.entityType === 'content' && $scope.options.allowBulkPublish,
                    allowBulkUnpublish: $scope.entityType === 'content' && $scope.options.allowBulkUnpublish,
                    allowBulkCopy: $scope.entityType === 'content' && $scope.options.allowBulkCopy,
                    allowBulkMove: $scope.options.allowBulkMove,
                    allowBulkDelete: $scope.options.allowBulkDelete,
                    layout: {
                        layouts: value.properties[0].config.layouts,
                        activeLayout: listViewHelper.getLayout($routeParams.id, value.properties[0].config.layouts)
                    }
                };
        }
    });
    $scope.predicate = $scope.options.orderBy;
    var deleteItemCallback = contentResource.deleteById;
    function fetchData() {
        return $http.get('/umbraco/api/SearchApi/GetAll/', { params: { id: $routeParams.id, name: $scope.searchTerm } }).then(function (response) {
            $scope.blogItems = response.data;
            $scope.validMessage = true;
            $scope.viewLoaded = true;
            var itemsToShow = $filter('orderBy')(response.data, $scope.predicate);
            $scope.totalPages = Math.ceil(response.data.length / $scope.options.pageSize);

            var begin = (($scope.options.pageNumber - 1) * $scope.options.pageSize)
                , end = begin + $scope.options.pageSize;

            $scope.order = function (predicate) {
                listViewHelper.setSorting(predicate, true, $scope.options);
                $scope.predicate = $scope.options.orderDirection === 'asc' ? predicate : "-" + predicate;
                $scope.currentPage = 1;
                itemsToShow = $filter('orderBy')(itemsToShow, $scope.predicate);
                $scope.filteredTodos = itemsToShow.slice(begin, end);
            };
            $scope.filteredTodos = itemsToShow.slice(begin, end);

        });
    }
    
    $scope.isSortDirection = function (col, direction) {
        return listViewHelper.setSortingDirection(col, direction, $scope.options);
    };
    $scope.clearSelection = function () {
        $scope.selectedIds = [];
    };
    
    $scope.areAllItemsSelected = function (blogItems) {
        if ($scope.selectedIds !== 'undefined') {
            if ($scope.selectedIds.length === 0) {
                return false;
            }
            else {
                if ($scope.selectedIds.length < blogItems.length) {
                    return false;
                }
                else {
                    return true;
                }
            }
        }
    };


    var makeCompleteSearch = function (searchTerm) {
        if (searchTerm !== null && searchTerm !== undefined) {
            $scope.options.pageNumber = 1;
            $scope.searchTerm = searchTerm;
            $scope.currentPage = 1;
          
            $scope.reloadCustomView();
        }
        $scope.reloadCustomView();
    };

    var searchListView = _.debounce(function (searchTerm) {
        $scope.$apply(function () {
            makeCompleteSearch(searchTerm);
        });
    }, 100);

    $scope.enterCompleteSearch = function (searchTerm) {
        $scope.viewLoaded = false;
        searchListView(searchTerm);
    };
    $scope.toggleSelection = function (val) {
        var idx = $scope.selectedIds.indexOf(val);
        if (idx > -1) {
            $scope.selectedIds.splice(idx, 1);
        } else {
            $scope.selectedIds.push(val);
        }
    };
    $scope.selectedItemsCount = function () {
        return $scope.selectedIds.length;
    };
    $scope.selectAllItems = function (blogItems) {
        var selectAll = false;
        if ($scope.selectedIds.length === 0) {
            selectAll = true;
        } else {
            if ($scope.areAllItemsSelected(blogItems) === true) {
                $scope.clearSelection();
                selectAll = false;
            } else {
                $scope.clearSelection();
                selectAll = true;
            }
        }
        if (selectAll) {
            angular.forEach(blogItems, function (value, key) {
                $scope.toggleSelection(value.id);
            });
        }
    };
    $scope.getItemIcon = function (item) {
        if ($scope.isRowSelected(item.id)) {
            return 'icon-check';
        }
        return item.icon;
    };
    $scope.isPublished = function (item) {
        if (parseInt(item.isPublished) === 0) {
            return false;
        }
        return true;
    };
    $scope.isRowSelected = function (id) {
        return $scope.selectedIds.indexOf(id) > -1;
    };

    $scope.ifAnythingIsSelected = function () {
        return $scope.selectedIds.length > 0;
    };

    $scope.next = function (pageNumber) {
        $scope.options.pageNumber = pageNumber;
        $scope.reloadCustomView();
    };
    $scope.goToPage = function (pageNumber) {
        $scope.options.pageNumber = pageNumber;
        $scope.reloadCustomView();
    };
    $scope.prev = function (pageNumber) {
        $scope.options.pageNumber = pageNumber;
        $scope.reloadCustomView();
    };


    $scope.delete = function () {
        if (confirm("Are you sure you want to delete " + $scope.selectedIds.length + " calendar?")) {
            $scope.actionInProgress = true;

            //TODO: do the real deleting here
            //This should be done by calling the api controller with the peopleResource using $scope.selectedIds

            $scope.blogItems = _.reject($scope.blogItems, function (el) { return $scope.selectedIds.indexOf(el.id) > -1; });
            $scope.selectedIds = [];
            $scope.actionInProgress = false;
        }
    };

    $scope.clickBlogItem = function (item) {
        var urlParam = '#/' + $scope.entityType + '/' + $scope.entityType + '/edit/' + item.id;
        return urlParam;
    };
    function applySelected(fn, getStatusMsg, getSuccessMsg, confirmMsg) {
        var selected = $scope.selectedIds;
        if (selected.length === 0)
            return;
        if (confirmMsg && !confirm(confirmMsg))
            return;
        $scope.actionInProgress = true;
        $scope.bulkStatus = getStatusMsg(0, selected.length);
        return serial(selected, fn, getStatusMsg, 0).then(function (result) {
            // executes once the whole selection has been processed
            // in case of an error (caught by serial), result will be the error
            if (!(result.data && angular.isArray(result.data.notifications)))
                showNotificationsAndReset(result, true, getSuccessMsg(selected.length));
        });
    }

    function serial(selected, fn, getStatusMsg, index) {
        return fn(selected, index).then(function (content) {
            index++;
            $scope.bulkStatus = getStatusMsg(index, selected.length);
            return index < selected.length ? serial(selected, fn, getStatusMsg, index) : content;
        }, function (err) {
            var reload = index > 0;
            showNotificationsAndReset(err, reload);
            return err;
        });
    }
    $scope.currentNodePermissions = {};

    var getIdCallback = function (selected) {
        return selected;
    };
    //Just ensure we do have an editorState
    if (editorState.current) {
        //Fetch current node allowed actions for the current user
        //This is the current node & not each individual child node in the list
        var currentUserPermissions = editorState.current.allowedActions;
        //Create a nicer model rather than the funky & hard to remember permissions strings
        $scope.currentNodePermissions = {
            'canCopy': _.contains(currentUserPermissions, 'O'),
            //Magic Char = O
            'canCreate': _.contains(currentUserPermissions, 'C'),
            //Magic Char = C
            'canDelete': _.contains(currentUserPermissions, 'D'),
            //Magic Char = D
            'canMove': _.contains(currentUserPermissions, 'M'),
            //Magic Char = M                
            'canPublish': _.contains(currentUserPermissions, 'U'),
            //Magic Char = U
            'canUnpublish': _.contains(currentUserPermissions, 'U')
        };
    }
    $scope.delete = function () {
        var confirmDeleteText = '';


        localizationService.localize('defaultdialogs_confirmdelete').then(function (value) {
            confirmDeleteText = value;
            var attempt = applySelected(function (selected, index) {
                return deleteItemCallback(getIdCallback(selected[index]));
            }, function (count, total) {
                var key = total === 1 ? 'bulk_deletedItemOfItem' : 'bulk_deletedItemOfItems';
                return localizationService.localize(key, [
                    count,
                    total
                ]);
            }, function (total) {
                var key = total === 1 ? 'bulk_deletedItem' : 'bulk_deletedItems';
                return localizationService.localize(key, [total]);
            }, confirmDeleteText + '?');
            if (attempt) {
                attempt.then(function () {
                    //executes if all is successful, let's sync the tree
                    var activeNode = appState.getTreeState('selectedNode');
                    if (activeNode) {
                        navigationService.reloadNode(activeNode);
                    }
                });
            }
        });
    };
    $scope.publish = function () {
        applySelected(function (selected, index) {
            return contentResource.publishById(getIdCallback(selected[index]));
        }, function (count, total) {
            var key = total === 1 ? 'bulk_publishedItemOfItem' : 'bulk_publishedItemOfItems';
            return localizationService.localize(key, [
                count,
                total
            ]);
        }, function (total) {
            var key = total === 1 ? 'bulk_publishedItem' : 'bulk_publishedItems';
            return localizationService.localize(key, [total]);
        });
    };
    $scope.unpublish = function () {
        applySelected(function (selected, index) {
            return contentResource.unPublish(getIdCallback(selected[index]));
        }, function (count, total) {
            var key = total === 1 ? 'bulk_unpublishedItemOfItem' : 'bulk_unpublishedItemOfItems';
            return localizationService.localize(key, [
                count,
                total
            ]);
        }, function (total) {
            var key = total === 1 ? 'bulk_unpublishedItem' : 'bulk_unpublishedItems';
            return localizationService.localize(key, [total]);
        });
    };
    $scope.move = function () {
        $scope.moveDialog = {};
        $scope.moveDialog.title = localizationService.localize('general_move');
        $scope.moveDialog.section = $scope.entityType;
        $scope.moveDialog.currentNode = $scope.contentId;
        $scope.moveDialog.view = 'move';
        $scope.moveDialog.show = true;
        $scope.moveDialog.submit = function (model) {
            if (model.target) {
                performMove(model.target);
            }
            $scope.moveDialog.show = false;
            $scope.moveDialog = null;
        };
        $scope.moveDialog.close = function (oldModel) {
            $scope.moveDialog.show = false;
            $scope.moveDialog = null;
        };
    };
    function performMove(target) {
        //NOTE: With the way this applySelected/serial works, I'm not sure there's a better way currently to return 
        // a specific value from one of the methods, so we'll have to try this way. Even though the first method
        // will fire once per every node moved, the destination path will be the same and we need to use that to sync.
        var newPath = null;
        applySelected(function (selected, index) {
            return contentResource.move({
                parentId: target.id,
                id: getIdCallback(selected[index])
            }).then(function (path) {
                newPath = path;
                return path;
            });
        }, function (count, total) {
            var key = total === 1 ? 'bulk_movedItemOfItem' : 'bulk_movedItemOfItems';
            return localizationService.localize(key, [
                count,
                total
            ]);
        }, function (total) {
            var key = total === 1 ? 'bulk_movedItem' : 'bulk_movedItems';
            return localizationService.localize(key, [total]);
        }).then(function () {
            //executes if all is successful, let's sync the tree
            if (newPath) {
                //we need to do a double sync here: first refresh the node where the content was moved,
                // then refresh the node where the content was moved from
                navigationService.syncTree({
                    tree: target.nodeType ? target.nodeType : target.metaData.treeAlias,
                    path: newPath,
                    forceReload: true,
                    activate: false
                }).then(function (args) {
                    //get the currently edited node (if any)
                    var activeNode = appState.getTreeState('selectedNode');
                    if (activeNode) {
                        navigationService.reloadNode(activeNode);
                    }
                });
            }
        });
    }
    $scope.copy = function () {
        $scope.copyDialog = {};
        $scope.copyDialog.title = localizationService.localize('general_copy');
        $scope.copyDialog.section = $scope.entityType;
        $scope.copyDialog.currentNode = $scope.contentId;
        $scope.copyDialog.view = 'copy';
        $scope.copyDialog.show = true;
        $scope.copyDialog.submit = function (model) {
            if (model.target) {
                performCopy(model.target, model.relateToOriginal);
            }
            $scope.copyDialog.show = false;
            $scope.copyDialog = null;
        };
        $scope.copyDialog.close = function (oldModel) {
            $scope.copyDialog.show = false;
            $scope.copyDialog = null;
        };
    };




    $scope.forceKeySearch = function (ev) {
        //13: enter
        switch (ev.keyCode) {
            case 13:
                makeCompleteSearch();
                break;
        }
    };

    if ($scope.entityType === 'content') {
        $scope.buttonPermissions = {
            canCopy: true,
            canCreate: true,
            canDelete: true,
            canMove: true,
            canPublish: true,
            canUnpublish: true
        };
    }

    $scope.reloadCustomView = function () {
        $scope.clearSelection();
        fetchData();
        //NOTE: This might occur if we are requesting a higher page number than what is actually available, for example
        // if you have more than one page and you delete all items on the last page. In this case, we need to reset to the last
        // available page and then re-load again
        if ($scope.options.pageNumber > $scope.totalPages) {
            $scope.options.pageNumber = $scope.totalPages;
            //reload!
            $scope.reloadCustomView();
        }

    };

    function showNotificationsAndReset(err, reload, successMsg) {
        //check if response is ysod
        if (err.status && err.status >= 500) {
            // Open ysod overlay
            $scope.ysodOverlay = {
                view: 'ysod',
                error: err,
                show: true
            };
        }
        $timeout(function () {
            $scope.bulkStatus = '';
            $scope.actionInProgress = false;
        }, 500);
        if (reload === true) {
            $scope.reloadCustomView();
        }
        if (err.data && angular.isArray(err.data.notifications)) {
            for (var i = 0; i < err.data.notifications.length; i++) {
                notificationsService.showNotification(err.data.notifications[i]);
            }
        } else if (successMsg) {
            localizationService.localize('bulk_done').then(function (v) {
                notificationsService.success(v, successMsg);
            });
        }
    }

    function performCopy(target, relateToOriginal) {
        applySelected(function (selected, index) {
            return contentResource.copy({
                parentId: target.id,
                id: selected[index],
                relateToOriginal: relateToOriginal
            });
        }, function (count, total) {
            var key = total === 1 ? 'bulk_copiedItemOfItem' : 'bulk_copiedItemOfItems';
            return localizationService.localize(key, [
                count,
                total
            ]);
        }, function (total) {
            var key = total === 1 ? 'bulk_copiedItem' : 'bulk_copiedItems';
            return localizationService.localize(key, [total]);
        });
        //angular.copy();
    }


    var getContentTypesCallback = $injector.get('contentTypeResource').getAllowedTypes;
    $scope.listViewAllowedChildrenTypes = getContentTypesCallback($scope.contentId);


    function initializeView() {
        //default to root id if the id is undefined
        var id = $routeParams.id;
        if (id === undefined) {
            id = -1;
        }
        $scope.contentId = id;
        $scope.isTrashed = id === '-20' || id === '-21';
        $scope.options.allowBulkPublish = $scope.options.allowBulkPublish && !$scope.isTrashed;
        $scope.options.allowBulkUnpublish = $scope.options.allowBulkUnpublish && !$scope.isTrashed;
        $scope.options.bulkActionsAllowed = $scope.options.allowBulkPublish || $scope.options.allowBulkUnpublish || $scope.options.allowBulkCopy || $scope.options.allowBulkMove || $scope.options.allowBulkDelete;

        $scope.reloadCustomView();
        
            var divToRemove = document.querySelector(".umb-editor-sub-header");
            if (divToRemove !== 'undefined') {
                divToRemove.remove();
            }

            var divToRemove2 = document.querySelector(".flex");
            if (divToRemove2 !== 'undefined') {
                divToRemove2.remove();
            }
        
    }
    initializeView();

});