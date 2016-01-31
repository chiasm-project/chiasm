import { select, selectAll } from "d3-selection";

selectAll('script[type="text/chiasm"]').each(function (){
  var root = select(this.parentNode).append("div");
  root.text("This will soon be a " + select(this).text());
});

export default "foo";
