export const STATUSES = ['new','open','pending','resolved','closed'] ;
export const PRIORITIES = ['low','medium','high' , 'urgent'] ; 

export const SLA_TARGET_MINUTES = {
    urgent : 60 ,//1hr
    high : 240 , // 4 hrs 
    medium : 480 , // 8 hrs , 
    low :1440  //24hr
}

export const AT_RISK_THRESHOLD = 0.8 ;//80% of target elapsed = 'at risk'
export const REOPEN_WINDOW_MS = 7*24*60*60*1000