/*
  title: Mindmap,
  description: A script that allows you to visualize your data as a mind map,
  Author: Benjamin Hatton
*/

//// Script configuration ////
// Map URL : the URL of the mindmap.html file (you can use https://basteks.github.io/mindmap/mindmap.html for testing purpose)
const mapURL = 'https://basteks.github.io/mindmap/mindmap.html';
// Table name
const tableStr = 'Table1';
// View name
const viewStr = 'Default View';
// Name of the column containing the name displayed in each mind map's nodes
const nameFieldStr = 'Name';
// Name of the column containing the relationship bewteen the nodes
const relationshipFieldStr = 'Children';
// What kind of relationship is described. Options are 'parent' or 'child'
const relationship = 'child';
// Is there a root node in your records (higher map level than any others)? Options are 'yes' or 'no'
const rootNode = 'yes';
// Map title (displayed in root node if no root node is present, or in the page title)
const mapTitle = 'My title';

function outputTable(obj) {
    function filterUnique(keys,totalKeys) {
        let found = false;
        for (let i=0;i<totalKeys.length;i++) {
            if (totalKeys[i].length==keys.length) {
              let foundCounter = 0;
              for (let k=0;k<keys.length;k++) {
                if(totalKeys[i].indexOf(keys[k])>-1) { foundCounter +=1 };
              }
              if (foundCounter==keys.length) {
                found = true;
                break;
              }
            }
        }
        return found;
    }
    function getDataStr(data,level,displayKeys) {
        let res = "";
        if (data.constructor== Object) {
            for (let i=0;i<Object.keys(data).length;i++) {
                if (res!="") { res += level==0 ? " | " : "; "; }
                res+= displayKeys? Object.keys(data)[i]+": "+getDataStr(Object.values(data)[i],level+1):getDataStr(Object.values(data)[i],level+1);
            }
        } else if (data.constructor== Array) {
            for (let i=0;i<data.length;i++) {
                if (res!="") { res += level==0 ? " | " : "; "; }
                res+= getDataStr(data[i],level+1,displayKeys);
            }
        } else {
          if (typeof(data)=="boolean") { res = data? "✓":"⨯";}
          else { res = data.toString(); }
        }
      return res;
    }
    function getKeys(obj) {
      let res=[];
        if (obj.constructor==Object){
          for (let i=0; i< Object.keys(obj).length; i++) {
            if (!filterUnique(Object.keys(obj)[i],res)) {
		      res.push(Object.keys(obj)[i]); 
		    }
          }
        } else if (obj.constructor==Array) {
          for (let i=0; i<Object.keys(obj).length; i++) {
             if (getKeys(obj[i]).length>0 && !filterUnique(getKeys(obj[i]),res)) { res.push(getKeys(obj[i])); }
          }
        } else { res.push(" "); }
        return res;
    }
	var markdownTableRows = [];
	var columnNumber = 0;
	var objKeys = getKeys(obj);
    if (objKeys.length==1) {
      output.text("length 1");
      for (let i=0; i< Object.keys(obj).length; i++) {
	    let firstCol = obj.constructor==Object? Object.keys(obj)[i]:i.toString();
	    markdownTableRows.push("| " + firstCol + " | " + getDataStr(Object.values(obj)[i],0,false));
      }
	  let hLine = "|:---:|";
	  for (let i=0;i<objKeys[0].length;i++) {
		hLine+= ':---:|';
	  }
	  markdownTableRows.unshift(hLine);
	  markdownTableRows.unshift("| | "+objKeys.toString().replaceAll(","," | ")+" |");
	}
    else {
	  let maxSize = 0;
      for (let i=0; i< Object.keys(obj).length; i++) {
	    let firstCol = obj.constructor==Object? Object.keys(obj)[i]:i.toString();
	    markdownTableRows.push("| " + firstCol + " | " + getDataStr(Object.values(obj)[i],0,true));
        var objSize = typeof(Object.values(obj)[i])=="object"? Object.keys(Object.values(obj)[i]).length : 1;
        maxSize = Math.max(maxSize,objSize);
      }
	  let hLine = "|:---:|";
	  let labels = "| |"
	  for (let i=1;i<maxSize+1;i++) {
		hLine+= ':---:|';
		labels+= ' '+i.toString()+' |';
	  }
	  markdownTableRows.unshift(hLine);
	  markdownTableRows.unshift(labels);
	}
    output.markdown(markdownTableRows.toString().replaceAll(",","\n").replaceAll(';',','));
}

//// Script run ////
const table = base.getTableByName(tableStr);
if (table) {
    const view = base.getViewByName(table, viewStr);
	const nameField = base.getColumnByName(table, nameFieldStr);
	const relationshipField = base.getColumnByName(table, relationshipFieldStr);
	if (view && nameField && relationshipField) {
        let query = base.getRows(table, view);

		var data = [];
		var error = false;
      
        function findNode(node) {
			let res = false;
			for (let i=0;i<data.length;i++) {
				if(data[i].id == node._id && data[i].topic == node[nameField.name]) {
					res = true;
					break;
				}
			}
			return res;
		}

		function findStringInArray (str, strArray) {
			for (var j=0; j<strArray.length; j++) {
				if (strArray[j].match(str)) return true;
			}
			return false;
		}
      
        if (relationship =="child") {
			for (let i=0;i<query.length;i++){
				if(!findNode(query[i])) {
					data.push({"id":query[i]._id, "isroot": false, "parentid":[], "topic":query[i][nameField.name]});
				}
				let children = query[i][relationshipField.name];
				if (children != null && children.length>0) {
					for (let j=0;j<children.length;j++) {
                      if(!findNode(base.getRowById(table,children[j]))) {
							let node = base.getRowById(table,children[j]);
							data.push({"id":node._id, "isroot": false, "parentid": [query[i]._id],"topic":node[nameField.name]});
					  }
                      else {
							let node=null;
							node = data.find(o => o.id == children[j]);
							if (node!= null) { node.parentid.push(query[i]._id); }
					  }
					}
				}
			}
		}
        else {
			for (let i=0;i<query.length;i++){
				if(!findNode(query[i])) {
					data.push({"id":query[i]._id, "isroot": false, "parentid":[], "topic":query[i][nameField.name]});
				}
				let parents = query[i][relationshipField.name];
				if (parents != null && parents.length>0) {
					for (let j=0;j<parents.length;j++) {
						if(!findNode(base.getRowById(table,parents[j]))) {
							let node = base.getRowById(table,parents[j]);
							data.push({"id":node._id, "isroot": false, "parentid": [],"topic":node[nameField.name]});
						}
						let node=null;
						node = data.find(o => o.id == query[i]._id);
						if (node!= null) {node.parentid.push(parents[j].id); }
					}
				}
			}
		}
        if (rootNode=='yes') {
			let rootCounter = 0;
			let rootIdx = -1;
				for (let i=0;i<data.length;i++) {
					if (data[i].parentid.length==0) {
						rootCounter +=1;
						rootIdx = i;
					}
				}
			if (rootCounter>1 || rootIdx == -1) {
				output.markdown("**Error finding the root node !**")
				if (rootCounter>1) { output.markdown("We found "+rootCounter.toString()+ " root nodes. Please check your data.")}
				error = true;
			}
			else {
				data[rootIdx]["level"]=0;
				data[rootIdx].parentid.push("");
				data[rootIdx]["isroot"]=true;
			}
		}
		else {
			for (let i=0;i<data.length;i++) {
				if (data[i].parentid.length==0) {
					data[i].parentid.push('root');
					data[i]["level"]=0;
				}   
			}
		}
        for (let i=0;i<data.length;i++) {
			if (data[i].parentid.length>1) {
				for (let p=0;p<data[i].parentid.length;p++) {
					data.push({"id":data[i].parentid[p]+"-"+data[i].id, "isroot": data[i].isroot, "parentid":[data[i].parentid[p]], "topic":data[i].topic});
				}
			}
		}
		for (let i=0;i<data.length;i++) {
			if (data[i].parentid.length>1) {
				data.splice(i,1);
			}
		}
		if (!error) {
			for (let i=0;i<data.length;i++) {
				if (!('level' in data[i] && data[i].level==0))
				{
					let inverselevel = 99;
					let level = 0;
					var parent = data[i];
					while(inverselevel>0) {
						if (data[i].parentid.length>0 && data[i].parentid[0]!="") {
							parent = data.find(o => o.id == parent.parentid[0]);
							level += 1;
							if ('level' in parent) { inverselevel = parent.level; }
						}
					}
					data[i].level = level;
				}
			}

			let firstLevel = rootNode=='no' ? 0 : 1;
			let firstLevelCounter = 0;
			for (let i=0;i<data.length;i++) {
				if (data[i].level == firstLevel) {
					firstLevelCounter +=1;
				}
			}
			output.markdown("**List of the records and their relationships :**")
			outputTable(data);
			var str="";
			for (let i=0;i<data.length;i++) {
				let mlevel = data[i].level;
				if(rootNode=='no') { mlevel += 1; }
				let mdir="";
				if (mlevel==1 && i<=firstLevelCounter/2) { mdir = 'L'; }
				else if (mlevel==1){ mdir = 'R'; }
				if (!(str === "")) {
					str+=';'
				}
				str+=mlevel.toString()+','+data[i].isroot+','+data[i].parentid[0]+','+mdir+','+data[i].id+','+data[i].topic;
			}
			output.markdown("[Link to the mind map]("+mapURL+encodeURI('?t='+mapTitle+'?r='+rootNode+'?nodes='+str)+")");
			output.markdown("_Script completed successfully_");
		}
    }
    else {
       if(!view) { output.markdown("⚠ Can't find the view! Please check view's name"); } 
       if(!nameField) { output.markdown("⚠ Can't find the nameField column! Please check the name"); } 
       if(!relationshipField) { output.markdown("⚠ Can't find the relationshipField column! Please check the name"); }
    }
} else { output.markdown("⚠ Can't find table! Please check table's name"); }
