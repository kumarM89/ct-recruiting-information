import {Pipe, PipeTransform} from '@angular/core'

@Pipe({
	name : "filteredGroups"
})
export class FilterGroup implements PipeTransform {
  transform(allItems: any[], filterValue: any, rankGroup: any, competency: any, grouping: any) {
  
    return allItems.filter(item => (!filterValue || item.parent == filterValue) && (!rankGroup || item.rankGroup == rankGroup) && (!competency || item.competency == competency) && (!grouping || item.grouping == grouping)).filter((v, i, a) => a.findIndex(d => d.value == v.value) == i);
  }
}
