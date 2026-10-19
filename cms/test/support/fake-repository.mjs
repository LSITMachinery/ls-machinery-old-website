import { randomUUID } from 'node:crypto';
import { buildPublicRelease } from '../../src/publication.mjs';
import { requiresTechnicalReview } from '../../src/schema.mjs';

export class FakeRepository {
  constructor() {
    this.users = [];
    this.sessions = new Map();
    this.limits = new Map();
    this.items = new Map();
    this.byRoute = new Map();
    this.media = new Map();
    this.audit = [];
    this.publicationJobs = new Map();
    this.migrationPreviews = new Map();
    this.migrationJobs = new Map();
    this.importedSources = new Map();
    this.settings = { navigation: {}, footer: {}, contact: {}, metadata: {} };
  }
  async userCount() { return this.users.length; }
  async bootstrapAdmin(data) {
    if (this.users.length) { const error = new Error('Already bootstrapped'); error.code='BOOTSTRAPPED'; throw error; }
    const user={id:randomUUID(),email:data.email,display_name:data.displayName,role:'admin',password_hash:data.passwordHash,disabled:false};
    this.users.push(user);this.event(user.id,'bootstrap_admin',user.id);return this.viewUser(user);
  }
  viewUser(user){return {id:user.id,email:user.email,displayName:user.display_name,role:user.role,disabled:user.disabled};}
  async findUserByEmail(email){return this.users.find((user)=>user.email===email)||null;}
  async getUserById(id){const user=this.users.find((row)=>row.id===id);return user?this.viewUser(user):null;}
  async consumeLoginAttempt(key,{limit}){const attempts=(this.limits.get(key)||0)+1;this.limits.set(key,attempts);return {allowed:attempts<=limit,attempts,resetAt:new Date()};}
  async clearLoginAttempts(key){this.limits.delete(key);}
  async createSession({tokenHash,userId,expiresAt}){this.sessions.set(tokenHash,{userId,expiresAt});}
  async getSession(tokenHash){const session=this.sessions.get(tokenHash);if(!session||session.expiresAt<=new Date())return null;const user=this.users.find((row)=>row.id===session.userId);return !user||user.disabled?null:{user:this.viewUser(user),expiresAt:session.expiresAt};}
  async deleteSession(tokenHash){this.sessions.delete(tokenHash);}
  async listStaff(){return this.users.map((user)=>this.viewUser(user));}
  async listAuditEvents(){return this.audit.slice().reverse().slice(0,300).map((event)=>{const actor=this.users.find((user)=>user.id===event.actor);return {action:event.action,entity_type:'content',entity_id:event.id,details:event.details,created_at:event.at,actor_name:actor?.display_name||null,actor_email:actor?.email||null};});}
  async getDashboardMetrics(routeCount=0){const records=[...this.items.values()];return {counts:{pages:routeCount||records.length,drafts:records.filter(item=>['draft','changes_requested'].includes(item.revision.status)).length,reviews:records.filter(item=>item.revision.status==='review_requested').length,media:this.media.size,storageBytes:[...this.media.values()].reduce((sum,row)=>sum+row.byteSize,0)},recentActivity:[],publication:{status:'idle',jobId:null,progress:0,updatedAt:null,message:'No CMS release has been activated yet.',activeReleaseId:null}};}
  async getSiteSettings(){return {settings:this.settings,updatedAt:new Date()};}
  async updateSiteSettings(settings,actorId){this.settings=settings;this.event(actorId,'settings_updated','site');return {settings:this.settings,updatedAt:new Date()};}
  async createPublicationJob({actorId,contentId,revisionId}){const row={id:randomUUID(),status:'queued',progress:0,message:'Waiting to build.',actor:actorId,candidateContentId:contentId,candidateRevisionId:revisionId,createdAt:new Date(),updatedAt:new Date(),completedAt:null,releaseId:null};this.publicationJobs.set(row.id,row);return row;}
  async updatePublicationJob({id,status,progress,message,releaseId=null}){const row=this.publicationJobs.get(id);if(!row)return null;Object.assign(row,{status,progress,message,releaseId:releaseId||row.releaseId,updatedAt:new Date(),completedAt:['active','failed'].includes(status)?new Date():null});return row;}
  async getPublicationJob(id){return this.publicationJobs.get(id)||null;}
  async listPublicationJobs(){return [...this.publicationJobs.values()].reverse();}
  async createStaff(data,actor){const user={id:randomUUID(),email:data.email,display_name:data.displayName,role:data.role,password_hash:data.passwordHash,disabled:false};this.users.push(user);this.event(actor,'staff_created',user.id,{role:user.role});return this.viewUser(user);}
  async updateStaff(data,actor){const user=this.users.find((row)=>row.id===data.id);if(!user){const error=new Error('Not found');error.code='NOT_FOUND';throw error;}if(user.role==='admin'&&!user.disabled&&((data.role!==undefined&&data.role!=='admin')||data.disabled===true)&&this.users.filter((row)=>row.role==='admin'&&!row.disabled).length<=1){const error=new Error('Keep at least one active administrator account.');error.code='LAST_ADMIN';throw error;}if(data.role)user.role=data.role;if(data.disabled!==undefined)user.disabled=data.disabled;if(data.displayName)user.display_name=data.displayName;if(user.disabled)for(const [key,value] of this.sessions)if(value.userId===user.id)this.sessions.delete(key);this.event(actor,'staff_updated',user.id);return this.viewUser(user);}
  viewRevision(revision){return {...revision,technicalReview:revision.review||null};}
  itemView(item){return {id:item.id,type:item.type,slug:item.slug,route:item.route,version:item.version,headRevisionId:item.revision.id,publishedRevisionId:item.publishedRevisionId,createdBy:item.createdBy,createdAt:item.createdAt,updatedAt:item.updatedAt,revision:this.viewRevision(item.revision)};}
  async listContent({type}={}){return [...this.items.values()].filter((item)=>!type||item.type===type).map((item)=>this.itemView(item));}
  async getContent(id){const item=this.items.get(id);return item?this.itemView(item):null;}
  async getContentByRoute(route){const id=this.byRoute.get(route);return id?this.itemView(this.items.get(id)):null;}
  async createContent({type,slug,route,validated,actorId}){if(this.byRoute.has(route)){const error=new Error('Duplicate route');error.code='23505';throw error;}const now=new Date();const id=randomUUID();const rev={id:randomUUID(),revisionNumber:1,parentRevisionId:null,fields:validated.fields,internalNotes:validated.internalNotes,sourceEvidence:validated.sourceEvidence,status:'draft',changedBy:actorId,changedByName:this.users.find((u)=>u.id===actorId)?.display_name,createdAt:now,review:null};const item={id,type,slug,route,version:1,revision:rev,revisions:[rev],publishedRevisionId:null,createdBy:actorId,createdAt:now,updatedAt:now};this.items.set(id,item);this.byRoute.set(route,id);this.event(actorId,'draft_created',id,{revisionId:rev.id});return this.itemView(item);}
  async updateDraft({id,expectedVersion,validated,actorId}){const item=this.items.get(id);if(!item){const error=new Error('Not found');error.code='NOT_FOUND';throw error;}if(item.version!==expectedVersion){const error=new Error('Version conflict');error.code='VERSION_CONFLICT';throw error;}const parent=item.revision;item.revision={id:randomUUID(),revisionNumber:parent.revisionNumber+1,parentRevisionId:parent.id,fields:validated.fields,internalNotes:validated.internalNotes,sourceEvidence:validated.sourceEvidence,status:'draft',changedBy:actorId,changedByName:this.users.find((u)=>u.id===actorId)?.display_name,createdAt:new Date(),review:null};item.revisions.push(item.revision);item.version++;item.updatedAt=new Date();this.event(actorId,'draft_saved',id,{revisionId:item.revision.id});return this.itemView(item);}
  async requestReview({id,revisionId,expectedVersion,actorId}){const item=this.items.get(id);if(!item){const error=new Error('Not found');error.code='NOT_FOUND';throw error;}if(item.version!==expectedVersion||item.revision.id!==revisionId){const error=new Error('Conflict');error.code='VERSION_CONFLICT';throw error;}if(!['draft','changes_requested'].includes(item.revision.status)){const error=new Error('Invalid state');error.code='INVALID_STATE';throw error;}item.revision.status='review_requested';item.version++;item.updatedAt=new Date();this.event(actorId,'review_requested',id,{revisionId});return this.itemView(item);}
  async reviewTechnical({id,revisionId,expectedVersion,decision,note,actorId}){const item=this.items.get(id);if(!item){const error=new Error('Not found');error.code='NOT_FOUND';throw error;}if(item.version!==expectedVersion||item.revision.id!==revisionId){const error=new Error('Conflict');error.code='VERSION_CONFLICT';throw error;}if(!requiresTechnicalReview(item.type,item.revision.fields)||item.revision.status!=='review_requested'){const error=new Error('Invalid state');error.code='INVALID_STATE';throw error;}item.revision.review={decision,note,reviewerId:actorId,reviewerName:this.users.find((u)=>u.id===actorId)?.display_name,createdAt:new Date()};item.revision.status=decision==='approved'?'ready_to_publish':'changes_requested';item.version++;this.event(actorId,`technical_${decision}`,id,{revisionId});return this.itemView(item);}
  async publish({id,revisionId,expectedVersion,confirmedRevisionId,actorId}){const item=this.items.get(id);if(!item){const error=new Error('Not found');error.code='NOT_FOUND';throw error;}if(item.version!==expectedVersion||item.revision.id!==revisionId||confirmedRevisionId!==revisionId){const error=new Error('Conflict');error.code='VERSION_CONFLICT';throw error;}const requiresReview=requiresTechnicalReview(item.type,item.revision.fields);const status=requiresReview?'ready_to_publish':'review_requested';if(item.revision.status!==status){const error=new Error('Review required');error.code='REVIEW_REQUIRED';throw error;}if(requiresReview&&item.revision.review?.decision!=='approved'){const error=new Error('Review required');error.code='REVIEW_REQUIRED';throw error;}item.publishedRevisionId=revisionId;item.revision.status='published';item.version++;item.updatedAt=new Date();this.event(actorId,'published',id,{revisionId});return this.itemView(item);}
  async getRevisionHistory(id){const item=this.items.get(id);return item?[...item.revisions].reverse().map((revision)=>this.viewRevision(revision)):[];}
  async getPrivateRevision(id,revisionId){const item=this.items.get(id);if(!item)return null;const revision=revisionId?item.revisions.find((row)=>row.id===revisionId):item.revision;if(!revision)return null;return {item:{id:item.id,type:item.type,slug:item.slug,route:item.route,version:item.version},revision:this.viewRevision(revision)};}
  async getPublished(route){const id=this.byRoute.get(route);const item=id&&this.items.get(id);if(!item?.publishedRevisionId)return null;return {id:item.id,type:item.type,slug:item.slug,route:item.route,revisionId:item.revision.id,revisionNumber:item.revision.revisionNumber,fields:item.revision.fields,publishedAt:item.updatedAt};}
  async listPublished(){const records=[];for(const item of this.items.values()){if(item.publishedRevisionId)records.push(await this.getPublished(item.route));}return records;}
  async getPublishedSearchIndex(locale){return buildPublicRelease(await this.listPublished()).searchIndex[locale]||[];}
  event(actor,action,id,details={}){this.audit.push({actor,action,id,details,at:new Date()});}
  async addMedia(media,actorId){const row={id:randomUUID(),...media,uploadedBy:actorId,createdAt:new Date()};this.media.set(row.id,row);return row;}
  async listMedia(){return [...this.media.values()];}
  async getMedia(id){return this.media.get(id)||null;}
  async getMediaDetails(id){const row=this.media.get(id);return row?{...row,usage:[]}:null;}
  async updateMediaMetadata(id,metadata,actorId){const row=this.media.get(id);if(!row)return null;Object.assign(row,{sourceUrl:metadata.sourceUrl,permissionStatus:metadata.permissionStatus,matchStatus:metadata.matchStatus,altTexts:metadata.altTexts});this.event(actorId,'media_metadata_updated',id);return row;}
  async createMigrationPreview(preview){this.migrationPreviews.set(preview.id,{...preview});}
  async getMigrationPreview(id,actorId){const preview=this.migrationPreviews.get(id);return preview&&preview.actorId===actorId&&preview.expiresAt>new Date()?{id,sourceFormat:preview.sourceFormat,fileName:preview.fileName,sourceChecksum:preview.sourceChecksum,preview:preview.preview}:null;}
  async createMigrationJob({previewId,actorId}){const job={id:randomUUID(),previewId,actorId,status:'queued',progress:0,message:'Waiting to import.',result:null,createdAt:new Date(),updatedAt:new Date()};this.migrationJobs.set(job.id,job);return job;}
  async updateMigrationJob(update){const job=this.migrationJobs.get(update.id);if(!job)return null;Object.assign(job,update,{updatedAt:new Date()});return job;}
  async getMigrationJob(id,actorId){const job=this.migrationJobs.get(id);return job?.actorId===actorId?job:null;}
  async getImportedSource(sourceKey){return this.importedSources.get(sourceKey)||null;}
  async recordImportedSource(source){if(this.importedSources.has(source.sourceKey))return false;this.importedSources.set(source.sourceKey,source);this.event(source.actorId,'migration_draft_created',source.contentId,{sourceKey:source.sourceKey});return true;}
  async isPublishedMedia(id){for(const item of this.items.values())if(item.publishedRevisionId&&item.revision.fields.mediaIds?.includes(id))return this.media.get(id)||null;return null;}
}
