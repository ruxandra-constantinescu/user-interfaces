export enum QuestionType {
    text = 'Text',
    checkbox = 'Checkbox',
    dropdown = 'Dropdown',
    rating = 'Rating',
    comment = 'Comment',
}
export interface Question {
    selected?: boolean;
    type: QuestionType;
    name: string;
    title: string;
    choices?: string[];
    rateValues?: number[];
    tags: string[];
}

export enum Tag {
    desk = 'Desk',
    room = 'Room',
    parking = 'Parking',
}

export class Survey {
    /** Unique Identifier of the object */
    public readonly id: string;
    /** Survey title entered by user */
    public readonly title: string;
    /** Survey description */
    public readonly description: string;
    /** Survey description */
    public readonly question_order: number;
    /** Type of event that triggers survey being sent */
    public readonly type: string;
    /** Building that survey is associated with */
    public readonly building_name: string;
    /** Level that survey is associated with */
    public readonly level: string;
    /** Date of survey creation */
    public readonly date_created: string;
    /** Link to survey for user completion */
    public readonly link: string;
    /** Survey options in Survey List component */
    public readonly options: string[];

    constructor(data: any = {}) {
        this.id = data.id || '';
        this.title = data.title || '';
        this.description = data.description || '';
        this.question_order = data.question_order || 0;
        this.type = data.survey_type || '';
        this.building_name = data.name || '';
        this.date_created = '';
        this.link = data.link || '';
        this.options = ['open'];
    }
}
