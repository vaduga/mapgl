export class VisLayer {
    index: number;
    label: string;
    name: string;
    group: string;
    fold: string;
    visible: boolean;
    indeterminate: boolean;
    children?: VisLayer[];
    combine?: boolean;
    constructor({ index, label, name, group, fold = 'open', visible = true, indeterminate = false, ...props }) {
        const {children} = props
          this.group = group;

        if (children && Array.isArray(children)) {
            this.children = children.map(child => new VisLayer(child))
        }
        this.index = index
        this.label = label;
        this.name = name;
        this.visible = visible;
        this.indeterminate = indeterminate;
        this.fold = fold;

    }


    setFold(flag: string) {
        this.fold = flag;
    }
}
