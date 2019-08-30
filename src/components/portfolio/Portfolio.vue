<template>
  <div>
    <v-hover>
      <v-card
        slot-scope="{ hover }"
        color="white lighten-4"
        exact
        light
        :class="`elevation-${hover ? 24 : 2}`"
      >
        <div v-if="$store.state.onlineFlag">
          <v-img :src="fireImg" height="40vh"></v-img>
        </div>
        <div v-else>
          <v-img :src="dataImg" height="40vh"></v-img>
        </div>
        <v-expand-transition>
          <div
            v-if="hover"
            class="d-flex transition-ease-in-out black darken-1 v-card--reveal display-3 white--text"
            style="height: 100%;justify-content:center;overflow:hidden;"
          >
          <v-layout justify-center align-center row wrap  style="margin:0;padding:0;height:80%;">
            <v-flex xs12 text-xs-center mt-2 mx-2 
            style="height:50px!important;overflow:hidden;font-size:0.6em; justify-content:center; text-overflow: ellipsis;">
              {{title}}
            </v-flex>
            <!-- Press 'Show More button' will pass data to PortDetail.vue -->
            <v-flex xs12 text-xs-center round class="bg-3"  style="height:50px!important;">
              <router-link :to="{name: 'portdetail',
                params: {id: id}}">
              <button
                class="button button--wayra button--border-medium button--text-medium button--size-s"
                style="max-width: 150px;padding:0.5em 1em; opacity: 0.98;"
              >더 보기</button>
              </router-link>
            </v-flex>
          </v-layout>
          </div>
        </v-expand-transition>
      </v-card>
    </v-hover>
  </div>
</template>

<script>
export default {
  name: "Portfolio",
  props: { // props data from PortfolioList.vue
    email: { type:String },
    date: { type: String },
    title: { type: String },
    body: { type: String },
    fireImg: { type: String},
    dataImg: { type: String },
    id: { type: String }
  },
  data() {
    return {
      dialog: false // Modal Condition
    };
  },
};
</script>

<style>
.port-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

p {
  margin-bottom: 0;
}

.port-body {
  margin-top: 0.4em;
  height: 4.4em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

p {
  margin-bottom: 0px;
  overflow:hidden;
}
p img{
  width:100%;
}

.v-card--reveal {
  align-items: center;
  justify-content: center;
  bottom: 0;
  opacity: 0.78;
  position: absolute;
  width: 100%;
}
.ql-align-center img{
  width:100%!important;
}
</style>
