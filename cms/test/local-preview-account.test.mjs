import test from 'node:test';
import assert from 'node:assert/strict';
import {localPreviewAccountAllowed, passwordError} from '../src/security.mjs';

test('temporary local password is denied by default and on external hosts or secure deployments', () => {
  const account = {password_hash:'hash',local_preview_password_hash:'hash'};
  assert.equal(localPreviewAccountAllowed(account),false);
  assert.equal(localPreviewAccountAllowed(account,{enabled:true,host:'127.0.0.1:8011'}),true);
  assert.equal(localPreviewAccountAllowed(account,{enabled:true,host:'lsmachinery.com.my'}),false);
  assert.equal(localPreviewAccountAllowed(account,{enabled:true,host:'127.0.0.1:8011',secureCookies:true}),false);
  assert.equal(localPreviewAccountAllowed({localPreviewOnly:true},{host:'localhost:8011'}),false);
  assert.equal(localPreviewAccountAllowed({...account,password_hash:'new-password-hash'}),true);
  assert.ok(passwordError('shortlocal1!'));
});
