import { ChangeDetectionStrategy, Output, EventEmitter, Component, OnDestroy, OnInit } from '@angular/core';
import { FileUploader, FileUploadModule } from "ng2-file-upload/ng2-file-upload";
import { read, IWorkBook } from "ts-xlsx";
import { WorkSheet } from "xlsx";
import { BehaviorSubject, Observable, Subject, Subscription, throwError } from "rxjs";
import { switchMap, map, catchError } from 'rxjs/operators';

const URL = 'https://foo.bar.com';

export interface UploadResult {
  result: "failure" | "success";
  payload: any;
}

@Component({
  selector: 'app-excel-upload',
  templateUrl: './excel-upload.component.html',
  styleUrls: ['./excel-upload.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExcelUploadComponent implements OnInit, OnDestroy {
  public uploader: FileUploader = new FileUploader({url: URL});
  public hasBaseDropZoneOver: boolean = false;
  public hasAnotherDropZoneOver: boolean = false;
  private subscription: Subscription;
  private filesSubject: Subject<File>;
  private _uploadedXls: Observable<{ result: string, payload: any }>;

  @Output()
  public uploadedXls: EventEmitter<UploadResult> = new EventEmitter();

  constructor() {
    this.filesSubject = new Subject();
    this._uploadedXls = this.filesSubject.asObservable().pipe(
      switchMap((file: File) => {
        return new Observable<any>((observer) => {
          let reader: FileReader = new FileReader();
          reader.onload = (e) => {
            observer.next((e.target as any).result);
          };

          reader.readAsBinaryString(file);
          return () => {
            reader.abort();
          };
        })
        .pipe(map((value: string) => {
          return read(value, {type: 'binary'});
        }), map((wb: IWorkBook) => {
          return wb.SheetNames.map((sheetName: string) => {
            let sheet: WorkSheet = wb.Sheets[sheetName];
            return sheet;
          });
        }), map((results: Array<any>) => {
          return {result: 'success', payload: results};
        }), catchError(e => throwError ({result: 'failure', payload: e})))
        //.catch(e => Observable.of({result: 'failure', payload: e}));
      }));
  }

  ngOnInit() {
    this.subscription = this._uploadedXls.subscribe(this.uploadedXls);
  }

  ngOnDestroy() {
    if ( this.subscription ) {
      this.subscription.unsubscribe();
    }
  }

  public fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  public fileOverAnother(e: any): void {
    this.hasAnotherDropZoneOver = e;
  }

  public fileDropped(files: FileList): void {
    for ( let i = 0 ; i < files.length ; i ++ ) {
      this.filesSubject.next(files[i]);
    }
  }

}
