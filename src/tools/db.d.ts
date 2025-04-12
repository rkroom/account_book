interface ICategoryFlow {
    first_level: string;
    flow_sign: string;
}

interface ICategoryInfo {
    first_level: string;
    specific_category: string;
    id: number;
}

interface IAccountIDNanme {
    id: number;
    name: string;
}

type ExcelBillTuple = [
    types_id: string | undefined | null,
    flow: string,
    detailed: string,
    account_info_id: string,
    aim_account_id: string | undefined | null,
    comment: string | undefined | null,
    when_time: string
];

type CategoryFlow = ICategoryFlow[];
type CategoryInfo = ICategoryInfo[];
type AccountIDNanme = iAccountIDNanme[];